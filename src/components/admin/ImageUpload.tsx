import { useId, useRef, useState, type DragEvent, type ClipboardEvent } from "react";
import { ImagePlus, Link as LinkIcon, Trash2, Upload } from "lucide-react";
import { api, ApiError } from "../../lib/http";
import { useToast } from "../ui/Toast";
import { Button, Input } from "./ui";
import styles from "./ImageUpload.module.css";

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: string; // ex: "4 / 3", "16 / 7", "1 / 1"
}

/**
 * Redimensiona e otimiza imagens no cliente antes de enviar.
 * Evita limites de upload do servidor, timeouts em conexões lentas e erros com fotos de celular (10MB+).
 */
async function optimizeImage(file: File): Promise<Blob | File> {
  // SVG e imagens muito pequenas (menos de 80KB) não precisam de processamento
  if (file.type === "image/svg+xml" || file.size < 80 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      const MAX_DIM = 1200;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Preenchimento branco para formatos com transparência convertidos para JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size > 0 && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.88
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(file);
    };

    img.src = blobUrl;
  });
}

export default function ImageUpload({ value, onChange, label = "Imagem", aspect = "4 / 3" }: Props) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");
  const toast = useToast();

  async function handleFile(file: File) {
    if (!file) return;

    // Aceita qualquer imagem ou arquivos com extensão gráfica
    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|bmp|avif|heic|heif)$/i.test(file.name);
    if (!isImage) {
      toast.error("Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP, etc).");
      return;
    }

    setUploading(true);

    try {
      const processed = await optimizeImage(file);
      const fd = new FormData();
      const ext = file.name.match(/\.[^/.]+$/)?.[0]?.toLowerCase() || ".jpg";
      const cleanExt = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext) ? ext : ".jpg";
      const safeName = `foto-${Date.now()}${cleanExt}`;

      fd.append("file", processed, safeName);

      const r = await api<{ url: string }>("/data/admin/upload", { method: "POST", formData: fd });
      onChange(r.url);
      toast.success("Imagem enviada com sucesso!");
    } catch (e) {
      console.error("Falha no upload da imagem:", e);
      toast.error(e instanceof ApiError ? e.message : "Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && !isDragging) setIsDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onPaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          break;
        }
      }
    }
  }

  return (
    <div className={styles.wrap} onPaste={onPaste}>
      <span className={styles.label}>{label}</span>

      {/* Input de arquivo nativo e oculto */}
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.heic,.heif"
        className={styles.hiddenInput}
        disabled={uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* Caixa de visualização — atua como label nativo que abre a escolha de arquivos */}
      <label
        htmlFor={inputId}
        className={`${styles.preview} ${isDragging ? styles.dragging : ""}`}
        style={{ aspectRatio: aspect }}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        title="Clique ou arraste uma foto aqui para fazer upload"
      >
        {value ? (
          <img src={value} alt="" />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={32} />
            <span>Clique ou arraste uma imagem aqui</span>
            <small>JPG, PNG, WEBP ou GIF (até 20 MB)</small>
          </div>
        )}
        {uploading && (
          <div className={styles.loading}>
            <Upload size={24} className="spin" />
            <span>Enviando e otimizando imagem…</span>
          </div>
        )}
      </label>

      {/* Botões de Ação */}
      <div className={styles.row}>
        <label htmlFor={inputId} className={`${styles.fileButton} ${uploading ? styles.disabled : ""}`}>
          <Upload size={15} />
          {uploading ? "Enviando…" : "Escolher arquivo"}
        </label>

        <Button size="sm" variant="ghost" onClick={() => setUrlMode((v) => !v)} disabled={uploading}>
          <LinkIcon size={15} /> Usar URL
        </Button>

        {value && (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)} disabled={uploading}>
            <Trash2 size={15} /> Remover foto
          </Button>
        )}
      </div>

      {urlMode && (
        <div className={styles.row}>
          <Input
            type="text"
            placeholder="https://… ou /uploads/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={uploading}
          />
          <Button
            size="sm"
            onClick={() => {
              if (url.trim()) {
                onChange(url.trim());
                setUrl("");
                setUrlMode(false);
              }
            }}
          >
            Aplicar URL
          </Button>
        </div>
      )}
    </div>
  );
}
