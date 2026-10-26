import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { LinkItem } from "../../lib/types";
import { useAdminList, useAdminMutations, moveIds } from "../../lib/adminApi";
import { ApiError } from "../../lib/http";
import { useToast } from "../../components/ui/Toast";
import { LINK_ICONS, LinkIconByName } from "../../components/ui/icons";
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
  Select,
  Switch,
  Table,
} from "../../components/admin/ui";
import styles from "./Products.module.css";

interface Form {
  label: string;
  url: string;
  icon: string;
  is_primary: boolean;
  active: boolean;
}

export default function AdminLinksPage() {
  const links = useAdminList<LinkItem>("links");
  const { create, update, remove, reorder } = useAdminMutations<LinkItem>("links");
  const toast = useToast();
  const [editing, setEditing] = useState<LinkItem | null | "new">(null);
  const [deleting, setDeleting] = useState<LinkItem | null>(null);
  const list = links.data ?? [];

  return (
    <>
      <PageHeader
        title="Árvore de links"
        subtitle="Botões exibidos na página inicial (estilo Linktree)"
        actions={
          <>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary">Ver página</Button>
            </a>
            <Button onClick={() => setEditing("new")}>
              <Plus size={16} /> Novo link
            </Button>
          </>
        }
      />

      <Table>
        <thead>
          <tr>
            <th style={{ width: 56 }}></th>
            <th>Rótulo</th>
            <th>URL</th>
            <th>Ativo</th>
            <th style={{ width: 150 }}></th>
          </tr>
        </thead>
        <tbody>
          {list.map((l, i) => (
            <tr key={l.id} className={!l.active ? styles.inactive : ""}>
              <td>
                <span className={styles.name} style={{ color: "var(--primary)" }}>
                  <LinkIconByName name={l.icon} size={20} />
                </span>
              </td>
              <td>
                <div className={styles.name}>
                  {l.label} {l.is_primary && <Badge tone="warning">Destaque</Badge>}
                </div>
              </td>
              <td className={styles.desc}>{l.url}</td>
              <td>
                <Switch
                  checked={l.active}
                  onChange={(v) => update.mutateAsync({ id: l.id, data: { active: v } }).catch(() => toast.error("Erro ao atualizar."))}
                  label={`Ativar ${l.label}`}
                />
              </td>
              <td>
                <div className={styles.rowActions}>
                  <IconButton label="Mover para cima" disabled={i === 0 || reorder.isPending} onClick={() => reorder.mutate(moveIds(list, i, i - 1))}>
                    <ArrowUp size={16} />
                  </IconButton>
                  <IconButton label="Mover para baixo" disabled={i === list.length - 1 || reorder.isPending} onClick={() => reorder.mutate(moveIds(list, i, i + 1))}>
                    <ArrowDown size={16} />
                  </IconButton>
                  <IconButton label="Editar" onClick={() => setEditing(l)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label="Excluir" onClick={() => setDeleting(l)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
          {!links.isLoading && list.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState>Nenhum link cadastrado.</EmptyState>
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <LinkForm
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        link={editing === "new" ? null : editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSubmit={async (data) => {
          if (editing && editing !== "new") {
            await update.mutateAsync({ id: editing.id, data });
            toast.success("Link atualizado.");
          } else {
            await create.mutateAsync(data);
            toast.success("Link criado.");
          }
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir link"
        message={`Excluir "${deleting?.label}" da página inicial?`}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync(deleting.id);
            toast.success("Link excluído.");
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

function LinkForm({ link, open, onClose, onSubmit }: { link: LinkItem | null; open: boolean; onClose: () => void; onSubmit: (d: Form) => Promise<void> }) {
  const { register, handleSubmit, control, setError, formState } = useForm<Form>({
    defaultValues: link
      ? { label: link.label, url: link.url, icon: link.icon ?? "link", is_primary: link.is_primary, active: link.active }
      : { label: "", url: "", icon: "link", is_primary: false, active: true },
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
    <Modal title={link ? "Editar link" : "Novo link"} open={open} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <FormGrid>
          <Field label="Rótulo" error={formState.errors.label?.message}>
            <Input autoFocus {...register("label", { required: "Informe o texto do botão." })} />
          </Field>
          <Field label="Ícone">
            <Select {...register("icon")}>
              {Object.entries(LINK_ICONS).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="span2">
            <Field label="URL" hint="Use /cardapio para o cardápio interno ou um endereço completo (https://…)" error={formState.errors.url?.message}>
              <Input {...register("url", { required: "Informe a URL." })} />
            </Field>
          </div>
          <Controller
            control={control}
            name="is_primary"
            render={({ field }) => (
              <label className={styles.switchRow}>
                <Switch checked={field.value} onChange={field.onChange} />
                <span>Botão de destaque</span>
              </label>
            )}
          />
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <label className={styles.switchRow}>
                <Switch checked={field.value} onChange={field.onChange} />
                <span>Visível</span>
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
