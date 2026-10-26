import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import type { Banner } from "../../lib/types";
import { useAdminList, useAdminMutations, moveIds } from "../../lib/adminApi";
import { ApiError } from "../../lib/http";
import { useToast } from "../../components/ui/Toast";
import ImageUpload from "../../components/admin/ImageUpload";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  FormActions,
  FormGrid,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Switch,
} from "../../components/admin/ui";
import formStyles from "./Products.module.css";
import styles from "./Banners.module.css";

interface Form {
  title: string;
  image_url: string | null;
  link_url: string;
  active: boolean;
}

export default function BannersPage() {
  const banners = useAdminList<Banner>("banners");
  const { create, update, remove, reorder } = useAdminMutations<Banner>("banners");
  const toast = useToast();
  const [editing, setEditing] = useState<Banner | null | "new">(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const list = banners.data ?? [];

  return (
    <>
      <PageHeader
        title="Banners"
        subtitle='Carrossel "Acabaram de chegar" no topo do cardápio (ideal 1600x700)'
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} /> Novo banner
          </Button>
        }
      />

      <div className={styles.grid}>
        {list.map((b, i) => (
          <article key={b.id} className={`${styles.card} ${!b.active ? styles.inactive : ""}`}>
            <div className={styles.media}>
              <img src={b.image_url} alt={b.title ?? ""} loading="lazy" />
              {!b.active && (
                <span className={styles.badge}>
                  <Badge tone="danger">Oculto</Badge>
                </span>
              )}
            </div>
            <div className={styles.body}>
              <div>
                <strong>{b.title || "Sem título"}</strong>
                {b.link_url && <small>{b.link_url}</small>}
              </div>
              <div className={styles.actions}>
                <Switch checked={b.active} onChange={(v) => update.mutateAsync({ id: b.id, data: { active: v } }).catch(() => toast.error("Erro ao atualizar."))} label="Ativo" />
                <IconButton label="Mover antes" disabled={i === 0 || reorder.isPending} onClick={() => reorder.mutate(moveIds(list, i, i - 1))}>
                  <ArrowLeft size={16} />
                </IconButton>
                <IconButton label="Mover depois" disabled={i === list.length - 1 || reorder.isPending} onClick={() => reorder.mutate(moveIds(list, i, i + 1))}>
                  <ArrowRight size={16} />
                </IconButton>
                <IconButton label="Editar" onClick={() => setEditing(b)}>
                  <Pencil size={16} />
                </IconButton>
                <IconButton label="Excluir" onClick={() => setDeleting(b)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!banners.isLoading && list.length === 0 && <EmptyState>Nenhum banner cadastrado.</EmptyState>}

      <BannerForm
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        banner={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSubmit={async (data) => {
          const payload = { ...data, title: data.title || null, link_url: data.link_url || null };
          if (editing && editing !== "new") {
            await update.mutateAsync({ id: editing.id, data: payload });
            toast.success("Banner atualizado.");
          } else {
            await create.mutateAsync(payload);
            toast.success("Banner criado.");
          }
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir banner"
        message="Tem certeza que deseja excluir este banner?"
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success("Banner excluído.");
            setDeleting(null);
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Erro ao excluir.");
          }
        }}
        loading={remove.isPending}
      />
    </>
  );
}

function BannerForm({ banner, open, onClose, onSubmit }: { banner: Banner | null; open: boolean; onClose: () => void; onSubmit: (d: Form) => Promise<void> }) {
  const { register, handleSubmit, control, setError, formState } = useForm<Form>({
    defaultValues: banner
      ? { title: banner.title ?? "", image_url: banner.image_url, link_url: banner.link_url ?? "", active: banner.active }
      : { title: "", image_url: null, link_url: "", active: true },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    if (!data.image_url) {
      setError("image_url", { message: "Envie uma imagem." });
      return;
    }
    try {
      await onSubmit(data);
    } catch (e) {
      if (e instanceof ApiError) {
        setServerError(e.message);
        Object.entries(e.details ?? {}).forEach(([f, m]) => setError(f as keyof Form, { message: m }));
      } else setServerError("Erro inesperado.");
    }
  });

  return (
    <Modal title={banner ? "Editar banner" : "Novo banner"} open={open} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <FormGrid>
          <div className="span2">
            <Controller
              control={control}
              name="image_url"
              render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} label="Imagem do banner" aspect="16 / 7" />}
            />
            {formState.errors.image_url && <p className={formStyles.serverError}>{formState.errors.image_url.message}</p>}
          </div>
          <Field label="Título (opcional)">
            <Input {...register("title")} />
          </Field>
          <Field label="Link ao clicar (opcional)" hint="Ex.: https://instagram.com/... ou /cardapio">
            <Input {...register("link_url")} />
          </Field>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className={formStyles.switchRow}>
                <Switch checked={field.value} onChange={field.onChange} />
                <span>Exibir no carrossel</span>
              </label>
            )}
          />
        </FormGrid>
        {serverError && <p className={formStyles.serverError}>{serverError}</p>}
        <FormActions>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={formState.isSubmitting}>
            Salvar
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
