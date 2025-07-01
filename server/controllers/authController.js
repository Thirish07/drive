const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const redisClient = require('../config/redis');
const pool = require('../config/db');
const { sendOTP } = require('../utils/mailer');

// Register User
exports.register = async (req, res) => {
  const { username, email, phone_no, firstname, lastname, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    await pool.query(
      `INSERT INTO users (username, email, phone_no, firstname, lastname, password)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [username, email, phone_no, firstname, lastname, hashedPassword]
    );

    await redisClient.set(email, otp, { EX: 3600 });
    await sendOTP(email, otp);

    res.status(201).json({ message: 'User registered. OTP sent to email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify OTP

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const storedOTP = await redisClient.get(email);
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    // ✅ Mark user as verified
    const userRes = await pool.query('UPDATE users SET is_verified = true WHERE email = $1 RETURNING *', [email]);
    await redisClient.del(email);

    const user = userRes.rows[0];

    // ✅ Issue JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ Send it back
    res.status(200).json({
      message: 'OTP verified successfully.',
      token,  // 🎯 this is what was missing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// exports.verifyOTP = async (req, res) => {
//   const { email, otp } = req.body;
//   try {
//     const storedOTP = await redisClient.get(email);
//     if (!storedOTP || storedOTP !== otp) {
//       return res.status(400).json({ error: 'Invalid or expired OTP.' });
//     }

//     await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
//     await redisClient.del(email);

//     res.status(200).json({ message: 'OTP verified successfully.' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Resend OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(email, otp, { EX: 3600 });
    await sendOTP(email, otp);

    res.status(200).json({ message: 'OTP resent successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    if (!user.is_verified) {
      return res.status(400).json({ error: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Edit User
exports.editUser = async (req, res) => {
  const { userId } = req.user;
  const { username, phone_no, firstname, lastname } = req.body;
  try {
    await pool.query(
      `UPDATE users SET
        username = COALESCE($1, username),
        phone_no = COALESCE($2, phone_no),
        firstname = COALESCE($3, firstname),
        lastname = COALESCE($4, lastname)
      WHERE id = $5`,
      [username, phone_no, firstname, lastname, userId]
    );

    res.status(200).json({ message: 'User details updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Logout 
exports.logout = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(400).json({ error: 'Token not provided' });

  await redisClient.set(token, 'blacklisted');
  res.status(200).json({ message: 'Logged out successfully.' });
};


// Delete Account
exports.deleteAccount = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const { userId } = req.user;

  try {
    // Deleting user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Blaclist
    if (token) await redisClient.set(token, 'blacklisted');

    res.status(200).json({ message: 'Account deleted and logged out.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Forgot Password 
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "No user found with this email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisClient.set(`reset-${email}`, otp, { EX: 3600 }); // expire in 1 hour
    await sendOTP(email, otp);

    res.status(200).json({ message: "OTP sent to email for password reset." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const storedOTP = await redisClient.get(`reset-${email}`);
    if (!storedOTP || storedOTP !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    await redisClient.del(`reset-${email}`);

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
