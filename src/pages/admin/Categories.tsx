import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { Category } from "../../lib/types";
import { useAdminList, useAdminMutations, moveIds } from "../../lib/adminApi";
import { ApiError } from "../../lib/http";
import { useToast } from "../../components/ui/Toast";
import ImageUpload from "../../components/admin/ImageUpload";
import {
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
  Table,
  Thumb,
} from "../../components/admin/ui";
import styles from "./Products.module.css";

interface Form {
  name: string;
  slug: string;
  image_url: string | null;
  active: boolean;
}

export default function CategoriesPage() {
  const categories = useAdminList<Category>("categories");
  const { create, update, remove, reorder } = useAdminMutations<Category>("categories");
  const toast = useToast();
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const list = categories.data ?? [];

  async function move(i: number, dir: -1 | 1) {
    try {
      await reorder.mutateAsync(moveIds(list, i, i + dir));
    } catch {
      toast.error("Não foi possível reordenar.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Categoria excluída.");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        title="Categorias"
        subtitle="A ordem aqui define a ordem no cardápio"
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} /> Nova categoria
          </Button>
        }
      />

      <Table>
        <thead>
          <tr>
            <th style={{ width: 64 }}></th>
            <th>Nome</th>
            <th>Identificador</th>
            <th>Pratos</th>
            <th>Ativa</th>
            <th style={{ width: 150 }}></th>
          </tr>
        </thead>
        <tbody>
          {list.map((c, i) => (
            <tr key={c.id} className={!c.active ? styles.inactive : ""}>
              <td>
                <Thumb src={c.image_url} alt={c.name} />
              </td>
              <td className={styles.name}>{c.name}</td>
              <td>
                <code>{c.slug}</code>
              </td>
              <td>{c.products_count}</td>
              <td>
                <Switch
                  checked={c.active}
                  onChange={(v) => update.mutateAsync({ id: c.id, data: { active: v } }).catch(() => toast.error("Erro ao atualizar."))}
                  label={`Ativar ${c.name}`}
                />
              </td>
              <td>
                <div className={styles.rowActions}>
                  <IconButton label="Mover para cima" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)}>
                    <ArrowUp size={16} />
                  </IconButton>
                  <IconButton label="Mover para baixo" disabled={i === list.length - 1 || reorder.isPending} onClick={() => move(i, 1)}>
                    <ArrowDown size={16} />
                  </IconButton>
                  <IconButton label="Editar" onClick={() => setEditing(c)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label="Excluir" onClick={() => setDeleting(c)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
          {!categories.isLoading && list.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState>Nenhuma categoria cadastrada.</EmptyState>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <CategoryForm
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        category={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSubmit={async (data) => {
          const payload = { ...data, slug: data.slug || undefined };
          if (editing && editing !== "new") {
            await update.mutateAsync({ id: editing.id, data: payload });
            toast.success("Categoria atualizada.");
          } else {
            await create.mutateAsync(payload);
            toast.success("Categoria criada.");
          }
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir categoria"
        message={`Excluir "${deleting?.name}"? Só é possível excluir categorias sem pratos.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
      />
    </>
  );
}

function CategoryForm({
  category,
  open,
  onClose,
  onSubmit,
}: {
  category: Category | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Form) => Promise<void>;
}) {
  const { register, handleSubmit, control, setError, formState } = useForm<Form>({
    defaultValues: category
      ? { name: category.name, slug: category.slug, image_url: category.image_url, active: category.active }
      : { name: "", slug: "", image_url: null, active: true },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = handleSubmit(async (data) => {
    setServerError(null);
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
    <Modal title={category ? "Editar categoria" : "Nova categoria"} open={open} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <FormGrid>
          <Field label="Nome" error={formState.errors.name?.message}>
            <Input autoFocus {...register("name", { required: "Informe o nome." })} />
          </Field>
          <Field label="Identificador (slug)" hint="Opcional. Gerado a partir do nome." error={formState.errors.slug?.message}>
            <Input placeholder="ex: espetos-carne" {...register("slug")} />
          </Field>
          <div className="span2">
            <Controller
              control={control}
              name="image_url"
              render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} label="Ícone da categoria" aspect="1 / 1" />}
            />
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className={styles.switchRow}>
                <Switch checked={field.value} onChange={field.onChange} />
                <span>Visível no cardápio</span>
              </label>
            )}
          />
        </FormGrid>
        {serverError && <p className={styles.serverError}>{serverError}</p>}
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
