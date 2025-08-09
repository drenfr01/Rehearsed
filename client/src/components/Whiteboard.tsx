import { useCallback } from "react";
import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";

interface WhiteboardProps {
  onSave: (blob: Blob) => void;
  height?: string | number;
}

function WhiteboardControls({ onSave }: { onSave: (blob: Blob) => void }) {
  const editor = useEditor();

  const handleSave = useCallback(async () => {
    const shapeIds = Array.from(editor.getCurrentPageShapeIds());
    const result = await editor.toImage(shapeIds, {
      format: "png",
      background: true,
    });
    if (result?.blob) onSave(result.blob);
  }, [editor, onSave]);

  return (
    <button
      type="button"
      onClick={handleSave}
      style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}
      className="button is-primary"
    >
      Save Whiteboard
    </button>
  );
}

export default function Whiteboard({ onSave, height = 360 }: WhiteboardProps) {
  return (
    <div className="box mb-4" style={{ height, position: "relative" }}>
      <Tldraw>
        <WhiteboardControls onSave={onSave} />
      </Tldraw>
    </div>
  );
}
