// components/DraggableCard.jsx
import { useDrag } from 'react-dnd';

const DraggableCard = ({ item, type, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: {
      id: item.id,
      itemType: type
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

export default DraggableCard;
