import { useRef, useState } from "react";
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

export default function ImageUpload({ value, onChange, label = "Imagem", aspect = "4 / 3" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");
  const toast = useToast();

  async function handleFile(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const r = await api<{ url: string }>("/data/admin/upload", { method: "POST", formData: fd });
      onChange(r.url);
      toast.success("Imagem enviada.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.preview} style={{ aspectRatio: aspect }}>
        {value ? (
          <img src={value} alt="" />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={28} />
            <span>Nenhuma imagem</span>
          </div>
        )}
        {uploading && <div className={styles.loading}>Enviando…</div>}
      </div>

      <div className={styles.row}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} loading={uploading}>
          <Upload size={15} /> Enviar arquivo
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setUrlMode((v) => !v)}>
          <LinkIcon size={15} /> Usar URL
        </Button>
        {value && (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
            <Trash2 size={15} /> Remover
          </Button>
        )}
      </div>

      {urlMode && (
        <div className={styles.row}>
          <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
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
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
