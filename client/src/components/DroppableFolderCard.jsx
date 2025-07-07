// components/DroppableFolderCard.jsx
import { useDrop } from 'react-dnd';
import { Folder } from "lucide-react";

const DroppableFolderCard = ({ folder, onDropItem, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['file', 'folder'],
    drop: (draggedItem) => {
      if (draggedItem.id !== folder.id) {
        onDropItem(draggedItem, folder.id);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isOver ? '#e3f2fd' : 'transparent',
        borderRadius: 6,
      }}
    >
      {children}
    </div>
  );
};

export default DroppableFolderCard;
