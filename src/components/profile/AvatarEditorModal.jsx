import { X } from 'lucide-react';
import { useRef, useState } from 'react';

const VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 480;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function AvatarEditorModal({ photoUrl, onClose, onSave }) {
  const imgRef = useRef(null);
  const dragState = useRef(null);
  const [naturalSize, setNaturalSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const baseScale = naturalSize
    ? Math.max(VIEWPORT_SIZE / naturalSize.width, VIEWPORT_SIZE / naturalSize.height)
    : 1;
  const totalScale = baseScale * zoom;
  const displayedWidth = naturalSize ? naturalSize.width * totalScale : 0;
  const displayedHeight = naturalSize ? naturalSize.height * totalScale : 0;

  const clampPosition = (pos, width, height) => ({
    x: clamp(pos.x, Math.min(0, VIEWPORT_SIZE - width), 0),
    y: clamp(pos.y, Math.min(0, VIEWPORT_SIZE - height), 0),
  });

  const handleImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.target;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    const scale = Math.max(VIEWPORT_SIZE / naturalWidth, VIEWPORT_SIZE / naturalHeight);
    setPosition({
      x: (VIEWPORT_SIZE - naturalWidth * scale) / 2,
      y: (VIEWPORT_SIZE - naturalHeight * scale) / 2,
    });
  };

  const handleZoomChange = (event) => {
    const nextZoom = Number(event.target.value);
    setZoom(nextZoom);
    if (!naturalSize) return;

    const nextScale = baseScale * nextZoom;
    setPosition((current) =>
      clampPosition(current, naturalSize.width * nextScale, naturalSize.height * nextScale),
    );
  };

  const handlePointerDown = (event) => {
    dragState.current = { x: event.clientX, y: event.clientY, posX: position.x, posY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState.current || !naturalSize) return;
    const deltaX = event.clientX - dragState.current.x;
    const deltaY = event.clientY - dragState.current.y;
    setPosition(
      clampPosition(
        { x: dragState.current.posX + deltaX, y: dragState.current.posY + deltaY },
        displayedWidth,
        displayedHeight,
      ),
    );
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  const handleReset = () => {
    setZoom(1);
    if (!naturalSize) return;
    setPosition({
      x: (VIEWPORT_SIZE - naturalSize.width * baseScale) / 2,
      y: (VIEWPORT_SIZE - naturalSize.height * baseScale) / 2,
    });
  };

  const handleSave = async () => {
    if (!naturalSize) return;
    setSaving(true);
    setError('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      const srcSize = VIEWPORT_SIZE / totalScale;
      ctx.drawImage(
        imgRef.current,
        -position.x / totalScale,
        -position.y / totalScale,
        srcSize,
        srcSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE,
      );

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      if (!blob) throw new Error('Nao foi possivel gerar a imagem.');

      await onSave(blob);
      onClose();
    } catch (err) {
      setError(err.message ?? 'Nao foi possivel salvar a foto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="edit-modal avatar-editor-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
        <div className="edit-modal-header">
          <div>
            <p className="eyebrow">Editar foto</p>
            <h2 id="avatar-editor-title">Ajuste o enquadramento</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="avatar-editor-body">
          {error ? <div className="auth-alert error">{error}</div> : null}

          <div
            className="avatar-editor-viewport"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img
              ref={imgRef}
              src={photoUrl}
              alt=""
              crossOrigin="anonymous"
              draggable={false}
              onLoad={handleImageLoad}
              style={{ left: position.x, top: position.y, width: displayedWidth, height: displayedHeight }}
            />
            <div className="avatar-editor-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>

          <label className="avatar-editor-zoom">
            <span>Zoom</span>
            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={handleZoomChange} />
          </label>

          <div className="modal-actions">
            <button type="button" className="ghost-button" onClick={handleReset}>
              Centralizar
            </button>
            <button type="button" className="primary-button" onClick={handleSave} disabled={saving || !naturalSize}>
              {saving ? 'Salvando...' : 'Salvar enquadramento'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AvatarEditorModal;
