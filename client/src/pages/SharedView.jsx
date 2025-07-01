
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import API from "../api";
// import { Folder, FileText } from "lucide-react";
// import "../pages/SharedView.css";

// const SharedView = () => {
//   const { token } = useParams();
//   const navigate = useNavigate();

//   const [item, setItem] = useState(null);
//   const [type, setType] = useState("");
//   const [role, setRole] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [children, setChildren] = useState([]);

//   useEffect(() => {
//     if (!token) return;

//     const accessToken = localStorage.getItem("accessToken");
//     localStorage.setItem("sharedToken", token);

//     if (!accessToken) {
//       window.location.href = `/login?redirect=/shared/file/${token}`;
//       return;
//     }

//     fetchSharedItem();
//   }, [token]);

//   const fetchSharedItem = async () => {
//     try {
//       let res;

//       try {
//         // Try folder first
//         res = await API.get(`/folders/shared/folder/${token}`, {
//           headers: { "x-shared-token": token },
//         });
//         setType("folder");
//         setItem(res.data.item);
//         setRole(res.data.role);

//         const childRes = await API.get(`/folders/${res.data.item.id}/children`, {
//           headers: { "x-shared-token": token },
//         });
//         setChildren(childRes.data || []);
//       } catch (folderErr) {
//         // Then try file
//         const fileRes = await API.get(`/files/shared/file/${token}`, {
//           headers: { "x-shared-token": token },
//         });
//         setType("file");
//         setItem(fileRes.data);
//         setRole(fileRes.data.role);
//       }

//       setLoading(false);
//     } catch (err) {
//       if (err.response?.status === 403) {
//         alert("Access denied. Please login.");
//         navigate(`/login?redirect=/shared/file/${token}`);
//       } else {
//         setLoading(false);
//       }
//     }
//   };

//   if (loading) return <div>Loading...</div>;
//   if (!item) return <div>Not found or access denied.</div>;

//   return (
//     <div className="shared-view-container">
//       <h2>{type === "folder" ? "Shared Folder" : "Shared File"}</h2>
//       <div className="shared-item">
//         {type === "folder" ? <Folder /> : <FileText />}
//         <p><strong>Name:</strong> {item.name}</p>
//         <p><strong>Owner:</strong> {item.owner_email || item.owner_id}</p>
//         <p><strong>Role:</strong> {role}</p>
//       </div>

//       {type === "file" && (
//         <div style={{ marginTop: "20px" }}>
//           <a
//             href={`http://localhost:5000/api/files/${item.file_id}/download`}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="download-link"
//           >
//             ⬇️ Download File
//           </a>
//         </div>
//       )}

//       {type === "folder" && (
//         <div>
//           <h3>Contents</h3>
//           {children.length === 0 ? (
//             <p>No items in this folder</p>
//           ) : (
//             children.map(child => (
//               <div key={child.id} className="shared-child-item">
//                 {child.type === "folder" ? <Folder /> : <FileText />}
//                 <span>{child.name}</span>
//               </div>
//             ))
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SharedView;



import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { Folder, FileText } from "lucide-react";
import "../pages/SharedView.css";

const SharedView = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [type, setType] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    if (!token) return;

    const accessToken = localStorage.getItem("accessToken");
    localStorage.setItem("sharedToken", token);

    if (!accessToken) {
      window.location.href = `/login?redirect=/shared/file/${token}`;
      return;
    }

    fetchSharedItem();
  }, [token]);

  const fetchSharedItem = async () => {
    try {
      let res;

      try {
        // Try folder first
        res = await API.get(`/folders/shared/folder/${token}`, {
          headers: { "x-shared-token": token },
        });
        setType("folder");
        setItem(res.data.item);
        setRole(res.data.role);

        const childRes = await API.get(`/folders/${res.data.item.id}/children`, {
          headers: { "x-shared-token": token },
        });
        setChildren(childRes.data || []);
      } catch (folderErr) {
        // Then try file
        const fileRes = await API.get(`/files/shared/file/${token}`, {
  headers: { "x-shared-token": token },
});
setType("file");
setItem(fileRes.data.item); // ✅ fixed
setRole(fileRes.data.role);

      }

      setLoading(false);
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Access denied. Please login.");
        navigate(`/login?redirect=/shared/file/${token}`);
      } else {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Not found or access denied.</div>;

  return (
    <div className="shared-view-container">
      <h2>{type === "folder" ? "Shared Folder" : "Shared File"}</h2>
      <div className="shared-item">
        {type === "folder" ? <Folder /> : <FileText />}
        <p><strong>Name:</strong> {item.name}</p>
        <p><strong>Owner:</strong> {item.owner_email || item.owner_id}</p>
        <p><strong>Role:</strong> {role}</p>
      </div>

      {type === "file" && (
        <div style={{ marginTop: "20px" }}>
          <a
  href={`http://localhost:5000/api/files/${item.id}/download`}
  headers={{ "x-shared-token": token }}
            target="_blank"
            rel="noopener noreferrer"
            className="download-link"
          >
            ⬇️ Download File
          </a>
        </div>
      )}

      {type === "folder" && (
        <div>
          <h3>Contents</h3>
          {children.length === 0 ? (
            <p>No items in this folder</p>
          ) : (
            children.map(child => (
              <div key={child.id} className="shared-child-item">
                {child.type === "folder" ? <Folder /> : <FileText />}
                <span>{child.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SharedView;
