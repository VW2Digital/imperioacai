import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { Category, Product } from "../../lib/types";
import { useAdminList, useAdminMutations, moveIds } from "../../lib/adminApi";
import { ApiError } from "../../lib/http";
import { formatPrice, normalize } from "../../lib/format";
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
  Select,
  Switch,
  Table,
  Textarea,
  Thumb,
} from "../../components/admin/ui";
import styles from "./Products.module.css";

interface Form {
  category_id: number | "";
  name: string;
  description: string;
  price: string;
  image_url: string | null;
  is_new: boolean;
  active: boolean;
}

const EMPTY: Form = { category_id: "", name: "", description: "", price: "", image_url: null, is_new: false, active: true };

export default function ProductsPage() {
  const products = useAdminList<Product>("products");
  const categories = useAdminList<Category>("categories");
  const { create, update, remove, reorder } = useAdminMutations<Product>("products");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<number | "">("");
  const [editing, setEditing] = useState<Product | null | "new">(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const term = normalize(search.trim());
  const list = useMemo(() => {
    return (products.data ?? []).filter(
      (p) => (catFilter === "" || p.category_id === catFilter) && (!term || normalize(`${p.name} ${p.description ?? ""}`).includes(term))
    );
  }, [products.data, catFilter, term]);

  // Ordenacao so faz sentido dentro da mesma categoria e sem busca
  const canReorder = catFilter !== "" && !term;

  async function move(index: number, dir: -1 | 1) {
    const ids = moveIds(list, index, index + dir);
    try {
      await reorder.mutateAsync(ids);
    } catch {
      toast.error("Não foi possível reordenar.");
    }
  }

  async function toggleActive(p: Product, active: boolean) {
    try {
      await update.mutateAsync({ id: p.id, data: { active } });
    } catch {
      toast.error("Não foi possível atualizar.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success("Prato excluído.");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        title="Pratos"
        subtitle={`${products.data?.length ?? 0} itens cadastrados`}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus size={16} /> Novo prato
          </Button>
        }
      />

      <div className={styles.filters}>
        <Input placeholder="Buscar por nome ou descrição…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value ? Number(e.target.value) : "")}>
          <option value="">Todas as categorias</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <Table>
        <thead>
          <tr>
            <th style={{ width: 64 }}></th>
            <th>Prato</th>
            <th>Categoria</th>
            <th>Preço</th>
            <th>Ativo</th>
            <th style={{ width: 150 }}></th>
          </tr>
        </thead>
        <tbody>
          {list.map((p, i) => (
            <tr key={p.id} className={!p.active ? styles.inactive : ""}>
              <td>
                <Thumb src={p.image_url} alt={p.name} />
              </td>
              <td>
                <div className={styles.name}>
                  {p.name} {p.is_new && <Badge tone="warning">Novo</Badge>}
                </div>
                {p.description && <div className={styles.desc}>{p.description}</div>}
              </td>
              <td>{p.category_name}</td>
              <td className={styles.price}>{formatPrice(p.price)}</td>
              <td>
                <Switch checked={p.active} onChange={(v) => toggleActive(p, v)} label={`Ativar ${p.name}`} />
              </td>
              <td>
                <div className={styles.rowActions}>
                  {canReorder && (
                    <>
                      <IconButton label="Mover para cima" disabled={i === 0 || reorder.isPending} onClick={() => move(i, -1)}>
                        <ArrowUp size={16} />
                      </IconButton>
                      <IconButton label="Mover para baixo" disabled={i === list.length - 1 || reorder.isPending} onClick={() => move(i, 1)}>
                        <ArrowDown size={16} />
                      </IconButton>
                    </>
                  )}
                  <IconButton label="Editar" onClick={() => setEditing(p)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label="Excluir" onClick={() => setDeleting(p)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
          {!products.isLoading && list.length === 0 && (
            <tr>
              <td colSpan={6}>
                <EmptyState>Nenhum prato encontrado.</EmptyState>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
      {catFilter === "" && !term && (
        <p className={styles.tip}>Dica: filtre por uma categoria para reordenar os pratos com as setas.</p>
      )}

      <ProductForm
        key={editing === "new" ? "new" : editing?.id ?? "closed"}
        product={editing === "new" ? null : editing}
        open={editing !== null}
        categories={categories.data ?? []}
        onClose={() => setEditing(null)}
        onSubmit={async (data) => {
          const payload = {
            ...data,
            category_id: Number(data.category_id),
            description: data.description || null,
          };
          if (editing && editing !== "new") {
            await update.mutateAsync({ id: editing.id, data: payload });
            toast.success("Prato atualizado.");
          } else {
            await create.mutateAsync(payload);
            toast.success("Prato criado.");
          }
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir prato"
        message={`Tem certeza que deseja excluir "${deleting?.name}"? Esta ação não pode ser desfeita.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
      />
    </>
  );
}

function ProductForm({
  product,
  open,
  categories,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: Form) => Promise<void>;
}) {
  const { register, handleSubmit, control, setError, formState } = useForm<Form>({
    defaultValues: product
      ? {
          category_id: product.category_id,
          name: product.name,
          description: product.description ?? "",
          price: product.price.toFixed(2).replace(".", ","),
          image_url: product.image_url,
          is_new: product.is_new,
          active: product.active,
        }
      : EMPTY,
  });
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => setServerError(null), [open]);

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await onSubmit(data);
    } catch (e) {
      if (e instanceof ApiError) {
        setServerError(e.message);
        Object.entries(e.details ?? {}).forEach(([field, msg]) => setError(field as keyof Form, { message: msg }));
      } else {
        setServerError("Erro inesperado.");
      }
    }
  });

  return (
    <Modal title={product ? "Editar prato" : "Novo prato"} open={open} onClose={onClose} width={640}>
      <form onSubmit={submit} noValidate>
        <FormGrid>
          <div className="span2">
            <Field label="Nome" error={formState.errors.name?.message}>
              <Input autoFocus {...register("name", { required: "Informe o nome." })} />
            </Field>
          </div>
          <Field label="Categoria" error={formState.errors.category_id?.message}>
            <Select {...register("category_id", { required: "Escolha a categoria." })}>
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preço (R$)" error={formState.errors.price?.message}>
            <Input inputMode="decimal" placeholder="0,00" {...register("price", { required: "Informe o preço." })} />
          </Field>
          <div className="span2">
            <Field label="Descrição" error={formState.errors.description?.message}>
              <Textarea {...register("description")} />
            </Field>
          </div>
          <div className="span2">
            <Controller
              control={control}
              name="image_url"
              render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} label="Foto do prato" />}
            />
          </div>
          <Controller
            control={control}
            name="is_new"
            render={({ field }) => (
              <label className={styles.switchRow}>
                <Switch checked={field.value} onChange={field.onChange} />
                <span>Destacar como novidade</span>
              </label>
            )}
          />
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
