import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/http";
import { qk, useSettings } from "../../lib/queries";
import type { Settings } from "../../lib/types";
import { useToast } from "../../components/ui/Toast";
import ImageUpload from "../../components/admin/ImageUpload";
import HoursEditor from "../../components/admin/HoursEditor";
import { Button, Card, Field, FormActions, FormGrid, Input, PageHeader, Textarea } from "../../components/admin/ui";
import styles from "./Settings.module.css";

type Form = Required<Settings>;

const EMPTY: Form = {
  site_name: "",
  tagline: "",
  logo_url: "",
  whatsapp_number: "",
  whatsapp_display: "",
  instagram_handle: "",
  address: "",
  maps_url: "",
  maps_embed_url: "",
  opening_hours: "",
  opening_schedule: "",
  new_arrivals_title: "",
  footer_credit_label: "",
  footer_credit_url: "",
  primary_color: "",
};

export default function SettingsPage() {
  const settings = useSettings();
  const qc = useQueryClient();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, control, reset, formState } = useForm<Form>({ defaultValues: EMPTY });

  useEffect(() => {
    if (settings.data) reset({ ...EMPTY, ...settings.data });
  }, [settings.data, reset]);

  const submit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      await api<Settings>("/data/admin/settings", { method: "PUT", body: data });
      qc.invalidateQueries({ queryKey: qk.settings });
      qc.invalidateQueries({ queryKey: qk.menu });
      toast.success("Configurações salvas.");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Erro ao salvar.");
    }
  });

  return (
    <>
      <PageHeader title="Configurações" subtitle="Dados exibidos na página inicial e no cardápio" />

      <form onSubmit={submit} noValidate className={styles.form}>
        <Card>
          <h2 className={styles.sectionTitle}>Identidade</h2>
          <FormGrid>
            <Field label="Nome do estabelecimento">
              <Input {...register("site_name")} />
            </Field>
            <Field label="Frase / tagline">
              <Input {...register("tagline")} />
            </Field>
            <div className="span2">
              <Controller
                control={control}
                name="logo_url"
                render={({ field }) => <ImageUpload value={field.value} onChange={(v) => field.onChange(v ?? "")} label="Logo" aspect="3 / 1" />}
              />
            </div>
            <Field label='Título do carrossel' hint='Padrão: "Acabaram de chegar"'>
              <Input {...register("new_arrivals_title")} />
            </Field>
          </FormGrid>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Horários de funcionamento</h2>
          <p className={styles.hint}>
            Cada dia pode ter dois turnos, por exemplo 11h às 15h e 18h às 22h. O segundo é opcional. Dia em branco não aparece no cardápio.
          </p>
          <Controller
            control={control}
            name="opening_schedule"
            render={({ field }) => <HoursEditor value={field.value} onChange={field.onChange} />}
          />
          <div className={styles.summary}>
            <Field label="Resumo na árvore de links" hint="Texto curto. Ex.: Ter a sáb, 11h às 15h - 18h às 22h">
              <Input {...register("opening_hours")} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Contato</h2>
          <FormGrid>
            <Field label="WhatsApp (somente números, com DDI)" hint="Ex.: 5591992910573">
              <Input inputMode="numeric" {...register("whatsapp_number")} />
            </Field>
            <Field label="WhatsApp (como exibir)" hint="Ex.: (91) 99291-0573">
              <Input {...register("whatsapp_display")} />
            </Field>
            <Field label="Instagram (sem @)">
              <Input {...register("instagram_handle")} />
            </Field>
          </FormGrid>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Localização</h2>
          <FormGrid>
            <div className="span2">
              <Field label="Endereço">
                <Textarea rows={2} {...register("address")} />
              </Field>
            </div>
            <div className="span2">
              <Field label="Link do Google Maps (botão Como chegar)">
                <Input {...register("maps_url")} />
              </Field>
            </div>
            <div className="span2">
              <Field label="URL do mapa incorporado (iframe)" hint="Google Maps > Compartilhar > Incorporar um mapa > copie só o src">
                <Input {...register("maps_embed_url")} />
              </Field>
            </div>
          </FormGrid>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Rodapé</h2>
          <FormGrid>
            <Field label="Crédito (nome)">
              <Input {...register("footer_credit_label")} />
            </Field>
            <Field label="Crédito (link)">
              <Input {...register("footer_credit_url")} />
            </Field>
          </FormGrid>
        </Card>

        {serverError && <p className={styles.error}>{serverError}</p>}

        <FormActions>
          <Button type="submit" loading={formState.isSubmitting}>
            Salvar configurações
          </Button>
        </FormActions>
      </form>
    </>
  );
}
