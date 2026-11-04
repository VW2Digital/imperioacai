import type { Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_new: boolean;
  sort_order: number;
  active: boolean;
  category_name?: string;
  category_slug?: string;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  products_count?: number;
}

interface Banner {
  id: number;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  active: boolean;
}

interface LinkItem {
  id: number;
  label: string;
  url: string;
  icon: string | null;
  is_primary: boolean;
  sort_order: number;
  active: boolean;
}

const initialCategories: Category[] = [
  { id: 1, slug: "acai-especial", name: "Açaí Especial", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/08/ChatGPT-Image-8-de-ago.-de-2026-11_27_35.png", sort_order: 1, active: true },
  { id: 2, slug: "acai-medio", name: "Açaí Médio", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/08/ChatGPT-Image-8-de-ago.-de-2026-11_17_12.png", sort_order: 2, active: true },
  { id: 3, slug: "farinha", name: "Farinha", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/WhatsApp-Image-2026-07-23-at-15.09.11.jpeg", sort_order: 3, active: true },
  { id: 4, slug: "farinha-de-tapioca", name: "Farinha de Tapioca", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/ChatGPT-Image-23-de-jul.-de-2026-15_20_24.png", sort_order: 4, active: true },
  { id: 5, slug: "entradas", name: "Entradas & Petiscos", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/WhatsApp-Image-2026-07-23-at-15.09.10-1.jpeg", sort_order: 5, active: false },
  { id: 6, slug: "acompanhamentos", name: "Acompanhamentos", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/WhatsApp-Image-2026-07-23-at-15.09.11.jpeg", sort_order: 6, active: false },
  { id: 7, slug: "bebidas", name: "Bebidas & Sucos", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/WhatsApp-Image-2026-07-23-at-15.09.10-2.jpeg", sort_order: 7, active: false },
  { id: 8, slug: "sobremesas", name: "Sobremesas", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/ChatGPT-Image-23-de-jul.-de-2026-15_20_24.png", sort_order: 8, active: false },
];

const initialProducts: Product[] = [
  { id: 1, category_id: 1, name: "Açaí Especial 1 Litro", description: "Açaí especial encorpado com máxima concentração de polpa pura da Amazônia.", price: 19.99, image_url: "/uploads/acai-1-litro.jpg", is_new: true, sort_order: 1, active: true, category_name: "Açaí Especial", category_slug: "acai-especial" },
  { id: 2, category_id: 2, name: "Açaí Especial 1 Litro", description: "Açaí médio puro, batido no ponto ideal com consistência cremosa e fresca. Extraído no mais alto padrão de qualidade paraense.", price: 16.00, image_url: "/uploads/acai-1-litro.jpg", is_new: false, sort_order: 2, active: true, category_name: "Açaí Médio", category_slug: "acai-medio" },
  { id: 3, category_id: 1, name: "Açaí Especial 500ml", description: "Porção de 500ml do nosso açaí especial. Intenso, puro e perfeito para quem ama açaí de alta consistência.", price: 9.99, image_url: "/uploads/acai-500ml.jpg", is_new: true, sort_order: 3, active: true, category_name: "Açaí Especial", category_slug: "acai-especial" },
  { id: 4, category_id: 2, name: "Açaí Médio 500ml", description: "Porção individual perfeita de açaí médio batido geladinho. Prático, cremoso e super saboroso.", price: 8.00, image_url: "/uploads/acai-500ml.jpg", is_new: false, sort_order: 4, active: true, category_name: "Açaí Médio", category_slug: "acai-medio" },
  { id: 5, category_id: 3, name: "Farinha d'Água Torrada (1 Litro)", description: "Farinha d'água artesanal, amarela e torrada no ponto perfeito. Crocância autêntica da culinária nortista.", price: 12.00, image_url: "/uploads/farinha-dagua.jpg", is_new: true, sort_order: 5, active: true, category_name: "Farinha", category_slug: "farinha" },
  { id: 6, category_id: 4, name: "Farinha de Tapioca Flocada (1 Litro)", description: "Farinha de tapioca em flocos branquinhos e super crocantes. Acompanhamento tradicional indispensável para saborear seu açaí.", price: 2.50, image_url: "/uploads/farinha-tapioca.jpg", is_new: false, sort_order: 1, active: true, category_name: "Farinha de Tapioca", category_slug: "farinha-de-tapioca" },
];

const initialBanners: Banner[] = [
  { id: 1, title: "Novidades do Império Açaí", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/IMG_9500-scaled.jpg", link_url: null, sort_order: 1, active: true },
  { id: 2, title: "O Melhor Açaí da Região", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/IMG_9567-scaled.jpg", link_url: null, sort_order: 2, active: true },
  { id: 3, title: "Petiscos e Pratos Especiais", image_url: "https://imperioacai.com.br/wp-content/uploads/2026/07/IMG_9712-scaled.jpg", link_url: null, sort_order: 3, active: true },
];

const initialLinks: LinkItem[] = [
  { id: 1, label: "Cardápio Online", url: "/cardapio", icon: "utensils", is_primary: true, sort_order: 1, active: true },
  { id: 2, label: "Pedir pelo WhatsApp", url: "https://wa.me/5591993726801", icon: "whatsapp", is_primary: false, sort_order: 2, active: true },
  { id: 3, label: "Instagram Oficial", url: "https://www.instagram.com/imperioacaicastanhal/", icon: "instagram", is_primary: false, sort_order: 3, active: true },
  { id: 4, label: "Como Chegar", url: "https://www.google.com/maps/search/?api=1&query=Tv.%20Mil%20Novecentos%20e%20Sessenta%20e%20Tr%C3%AAs%2C%202703%20-%20Estrela%2C%20Castanhal%20-%20PA%2C%2068742-238", icon: "map-pin", is_primary: false, sort_order: 4, active: true },
];

const PERSIST_FILE = path.resolve(process.cwd(), ".mock-state.json");

function loadPersistedState() {
  const base = {
    categories: [...initialCategories],
    products: [...initialProducts],
    banners: [...initialBanners],
    links: [...initialLinks],
    settings: {
      site_name: "Império Açaí",
      tagline: "O melhor do açaí e delícias em Castanhal/PA",
      logo_url: "/logo-horizontal.png",
      whatsapp_number: "5591993726801",
      whatsapp_display: "(91) 99372-6801",
      instagram_handle: "imperioacaicastanhal",
      address: "Tv. Mil Novecentos e Sessenta e Três, 2703 - Estrela, Castanhal - PA, 68742-238",
      maps_url: "https://www.google.com/maps/search/?api=1&query=Tv.%20Mil%20Novecentos%20e%20Sessenta%20e%20Tr%C3%AAs%2C%202703%20-%20Estrela%2C%20Castanhal%20-%20PA%2C%2068742-238",
      maps_embed_url: "https://www.google.com/maps?q=Tv.%20Mil%20Novecentos%20e%20Sessenta%20e%20Tr%C3%AAs%2C%202703%20-%20Estrela%2C%20Castanhal%20-%20PA%2C%2068742-238&output=embed",
      opening_hours: "Segunda a Sábado: 11h às 23h",
      new_arrivals_title: "Acabaram de chegar",
      footer_credit_label: "Agência VW2",
      footer_credit_url: "https://www.instagram.com/agenciavw2/",
      primary_color: "#461444",
    } as Record<string, any>,
    authenticated: true,
  };

  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE, "utf-8"));
      if (data && typeof data === "object") {
        if (Array.isArray(data.categories) && data.categories.length) base.categories = data.categories;
        if (Array.isArray(data.products) && data.products.length) base.products = data.products;
        if (Array.isArray(data.banners) && data.banners.length) base.banners = data.banners;
        if (Array.isArray(data.links) && data.links.length) base.links = data.links;
        if (data.settings) base.settings = { ...base.settings, ...data.settings };
      }
    }
  } catch (err) {
    console.error("Erro ao carregar .mock-state.json:", err);
  }

  // Garante que os açaís de 1 litro utilizem a foto oficial /uploads/acai-1-litro.jpg
  base.products.forEach((p) => {
    if (p.id === 2 || p.id === 7 || (p.name.toLowerCase().includes("1 litro") && (!p.image_url || p.image_url.includes("ChatGPT-Image")))) {
      if (!p.image_url || p.image_url.includes("ChatGPT-Image")) {
        p.image_url = "/uploads/acai-1-litro.jpg";
      }
    }
  });

  return base;
}

let state = loadPersistedState();

function persistState() {
  try {
    fs.writeFileSync(PERSIST_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar .mock-state.json:", err);
  }
}

let nextId = 200;


export function devMockPlugin(): Plugin {
  return {
    name: "dev-mock-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const urlStr = req.url || "";
        if (!urlStr.startsWith("/data")) {
          return next();
        }

        const pathname = urlStr.split("?")[0];
        const method = (req.method || "GET").toUpperCase();

        const json = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify(data));
        };

        const readRawBody = async (): Promise<Buffer> => {
          return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on("data", (c) => chunks.push(c));
            req.on("end", () => resolve(Buffer.concat(chunks)));
            req.on("error", reject);
          });
        };

        const readBody = async (): Promise<any> => {
          const rawBuf = await readRawBody();
          const raw = rawBuf.toString("utf-8");
          try {
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {};
          }
        };

        // ---------- AUTH ----------
        if (pathname === "/data/auth/login" && method === "POST") {
          const body = await readBody();
          const email = (body.email || "").toLowerCase().trim();
          const password = (body.password || "").trim();

          // Aceita admin@imperioacai.com.br com admin123 (ou variações no modo de desenvolvimento)
          if ((email === "admin@imperioacai.com.br" || email.includes("admin")) && (password === "admin123" || password === "admin" || password.length >= 4)) {
            state.authenticated = true;
            res.setHeader("Set-Cookie", "imperioacai_sess=dev_logged_in; Path=/; HttpOnly; SameSite=Lax");
            return json({
              user: { id: 1, name: "Administrador", email: "admin@imperioacai.com.br" },
              csrf: "mock-csrf-token-12345",
            });
          }

          return json({ error: "E-mail ou senha inválidos." }, 401);
        }

        if (pathname === "/data/auth/me" && method === "GET") {
          return json({
            user: { id: 1, name: "Administrador", email: "admin@imperioacai.com.br" },
            csrf: "mock-csrf-token-12345",
          });
        }

        if (pathname === "/data/auth/logout" && method === "POST") {
          state.authenticated = false;
          res.setHeader("Set-Cookie", "imperioacai_sess=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
          return json({ ok: true });
        }

        if (pathname === "/data/auth/password" && method === "PUT") {
          return json({ ok: true });
        }

        // ---------- PUBLIC ----------
        if (pathname === "/data/settings" && method === "GET") {
          return json(state.settings);
        }

        if (pathname === "/data/links" && method === "GET") {
          return json(state.links.filter((l) => l.active).sort((a, b) => a.sort_order - b.sort_order));
        }

        if (pathname === "/data/banners" && method === "GET") {
          return json(state.banners.filter((b) => b.active).sort((a, b) => a.sort_order - b.sort_order));
        }

        if (pathname === "/data/menu" && method === "GET") {
          const categories = state.categories
            .filter((c) => c.active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((cat) => ({
              id: cat.id,
              slug: cat.slug,
              name: cat.name,
              image_url: cat.image_url,
              products: state.products
                .filter((p) => p.category_id === cat.id && p.active)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((p) => ({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  price: p.price,
                  image_url: p.image_url,
                  is_new: p.is_new,
                })),
            }))
            .filter((c) => c.products.length > 0);

          const banners = state.banners
            .filter((b) => b.active)
            .sort((a, b) => a.sort_order - b.sort_order);

          return json({
            settings: state.settings,
            categories,
            banners,
          });
        }

        if (pathname === "/data/track" && method === "POST") {
          return json({ ok: true });
        }

        // ---------- ADMIN ----------
        if (pathname === "/data/admin/stats" && method === "GET") {
          const by_category = state.categories.map((c) => ({
            id: c.id,
            name: c.name,
            total: state.products.filter((p) => p.category_id === c.id && p.active).length,
          }));

          return json({
            products: state.products.length,
            products_active: state.products.filter((p) => p.active).length,
            products_new: state.products.filter((p) => p.is_new && p.active).length,
            categories: state.categories.length,
            banners: state.banners.filter((b) => b.active).length,
            links: state.links.filter((l) => l.active).length,
            by_category,
          });
        }

        if (pathname === "/data/admin/insights" && method === "GET") {
          const series = [
            { date: "2026-10-20", visits: 45, visitors: 30, clicks: 23 },
            { date: "2026-10-21", visits: 52, visitors: 35, clicks: 31 },
            { date: "2026-10-22", visits: 48, visitors: 32, clicks: 27 },
            { date: "2026-10-23", visits: 60, visitors: 40, clicks: 35 },
            { date: "2026-10-24", visits: 72, visitors: 48, clicks: 40 },
            { date: "2026-10-25", visits: 65, visitors: 42, clicks: 33 },
            { date: "2026-10-26", visits: 58, visitors: 39, clicks: 29 },
          ];

          return json({
            range: "7d",
            from: "2026-10-20",
            to: "2026-10-26",
            link_to_menu: 85,
            links: {
              visits: 400,
              visitors: 266,
              clicks: 218,
              series,
              clicks_by_target: state.links.map((l) => ({
                target_type: "link",
                target_id: l.id,
                label: l.label,
                clicks: 35,
              })),
            },
            menu: {
              visits: 350,
              visitors: 240,
              clicks: 180,
              series,
              clicks_by_target: state.products.slice(0, 5).map((p) => ({
                target_type: "product",
                target_id: p.id,
                label: p.name,
                clicks: 22,
              })),
            },
          });
        }

        if (pathname === "/data/admin/settings" && method === "PUT") {
          const body = await readBody();
          state.settings = { ...state.settings, ...body };
          persistState();
          return json({ ok: true, settings: state.settings });
        }

        // CRUD: Categories
        if (pathname === "/data/admin/categories") {
          if (method === "GET") return json(state.categories);
          if (method === "POST") {
            const body = await readBody();
            const item: Category = {
              id: ++nextId,
              slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
              name: body.name,
              image_url: body.image_url || null,
              sort_order: body.sort_order ?? state.categories.length + 1,
              active: body.active ?? true,
            };
            state.categories.push(item);
            persistState();
            return json(item, 201);
          }
        }

        const catMatch = pathname.match(/^\/data\/admin\/categories\/(\d+)$/);
        if (catMatch) {
          const id = Number(catMatch[1]);
          const idx = state.categories.findIndex((c) => c.id === id);
          if (idx === -1) return json({ error: "Não encontrado" }, 404);

          if (method === "GET") return json(state.categories[idx]);
          if (method === "PUT") {
            const body = await readBody();
            state.categories[idx] = { ...state.categories[idx], ...body, id };
            persistState();
            return json(state.categories[idx]);
          }
          if (method === "DELETE") {
            state.categories.splice(idx, 1);
            persistState();
            return json({ ok: true });
          }
        }

        if (pathname === "/data/admin/categories/reorder" && method === "PUT") {
          const { ids } = await readBody();
          if (Array.isArray(ids)) {
            state.categories.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            state.categories.forEach((c, i) => (c.sort_order = i + 1));
            persistState();
          }
          return json({ ok: true });
        }

        // CRUD: Products
        const parseMockPrice = (v: any) => {
          if (typeof v === "number") return Number.isFinite(v) ? v : 0;
          if (typeof v === "string") {
            const clean = v.replace(/[^\d.,]/g, "").trim();
            if (clean.includes(",")) return parseFloat(clean.replace(/\./g, "").replace(",", ".")) || 0;
            return parseFloat(clean) || 0;
          }
          return 0;
        };

        if (pathname === "/data/admin/products") {
          if (method === "GET") {
            const withMeta = state.products.map((p) => {
              const cat = state.categories.find((c) => c.id === p.category_id);
              return { ...p, category_name: cat?.name || "", category_slug: cat?.slug || "" };
            });
            return json(withMeta);
          }
          if (method === "POST") {
            const body = await readBody();
            const catId = Number(body.category_id);
            const cat = state.categories.find((c) => c.id === catId);
            const item: Product = {
              id: ++nextId,
              category_id: catId,
              name: String(body.name || "").trim(),
              description: body.description ? String(body.description).trim() : null,
              price: parseMockPrice(body.price),
              image_url: body.image_url || null,
              is_new: Boolean(body.is_new),
              sort_order: body.sort_order ?? state.products.length + 1,
              active: body.active !== undefined ? Boolean(body.active) : true,
              category_name: cat?.name || "",
              category_slug: cat?.slug || "",
            };
            state.products.push(item);
            persistState();
            return json(item, 201);
          }
        }

        const prodMatch = pathname.match(/^\/data\/admin\/products\/(\d+)$/);
        if (prodMatch) {
          const id = Number(prodMatch[1]);
          const idx = state.products.findIndex((p) => p.id === id);
          if (idx === -1) return json({ error: "Não encontrado" }, 404);

          if (method === "GET") {
            const cat = state.categories.find((c) => c.id === state.products[idx].category_id);
            return json({ ...state.products[idx], category_name: cat?.name || "", category_slug: cat?.slug || "" });
          }
          if (method === "PUT") {
            const body = await readBody();
            const current = state.products[idx];
            const targetCatId = body.category_id !== undefined ? Number(body.category_id) : current.category_id;
            const cat = state.categories.find((c) => c.id === targetCatId);
            state.products[idx] = {
              ...current,
              ...body,
              id,
              category_id: targetCatId,
              category_name: cat?.name || current.category_name || "",
              category_slug: cat?.slug || current.category_slug || "",
              name: body.name !== undefined ? String(body.name).trim() : current.name,
              description: body.description !== undefined ? (body.description ? String(body.description).trim() : null) : current.description,
              price: body.price !== undefined ? parseMockPrice(body.price) : current.price,
              image_url: body.image_url !== undefined ? (body.image_url || null) : current.image_url,
              is_new: body.is_new !== undefined ? Boolean(body.is_new) : current.is_new,
              active: body.active !== undefined ? Boolean(body.active) : current.active,
            };
            persistState();
            return json(state.products[idx]);
          }
          if (method === "DELETE") {
            state.products.splice(idx, 1);
            persistState();
            return json({ ok: true });
          }
        }

        if (pathname === "/data/admin/products/reorder" && method === "PUT") {
          const { ids } = await readBody();
          if (Array.isArray(ids)) {
            state.products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            state.products.forEach((p, i) => (p.sort_order = i + 1));
            persistState();
          }
          return json({ ok: true });
        }

        // CRUD: Banners
        if (pathname === "/data/admin/banners") {
          if (method === "GET") return json(state.banners);
          if (method === "POST") {
            const body = await readBody();
            const item: Banner = {
              id: ++nextId,
              title: body.title || null,
              image_url: body.image_url,
              link_url: body.link_url || null,
              sort_order: body.sort_order ?? state.banners.length + 1,
              active: body.active ?? true,
            };
            state.banners.push(item);
            persistState();
            return json(item, 201);
          }
        }

        const bannerMatch = pathname.match(/^\/data\/admin\/banners\/(\d+)$/);
        if (bannerMatch) {
          const id = Number(bannerMatch[1]);
          const idx = state.banners.findIndex((b) => b.id === id);
          if (idx === -1) return json({ error: "Não encontrado" }, 404);

          if (method === "GET") return json(state.banners[idx]);
          if (method === "PUT") {
            const body = await readBody();
            state.banners[idx] = { ...state.banners[idx], ...body, id };
            persistState();
            return json(state.banners[idx]);
          }
          if (method === "DELETE") {
            state.banners.splice(idx, 1);
            persistState();
            return json({ ok: true });
          }
        }

        if (pathname === "/data/admin/banners/reorder" && method === "PUT") {
          const { ids } = await readBody();
          if (Array.isArray(ids)) {
            state.banners.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            state.banners.forEach((b, i) => (b.sort_order = i + 1));
            persistState();
          }
          return json({ ok: true });
        }

        // CRUD: Links
        if (pathname === "/data/admin/links") {
          if (method === "GET") return json(state.links);
          if (method === "POST") {
            const body = await readBody();
            const item: LinkItem = {
              id: ++nextId,
              label: body.label,
              url: body.url,
              icon: body.icon || null,
              is_primary: !!body.is_primary,
              sort_order: body.sort_order ?? state.links.length + 1,
              active: body.active ?? true,
            };
            state.links.push(item);
            persistState();
            return json(item, 201);
          }
        }

        const linkMatch = pathname.match(/^\/data\/admin\/links\/(\d+)$/);
        if (linkMatch) {
          const id = Number(linkMatch[1]);
          const idx = state.links.findIndex((l) => l.id === id);
          if (idx === -1) return json({ error: "Não encontrado" }, 404);

          if (method === "GET") return json(state.links[idx]);
          if (method === "PUT") {
            const body = await readBody();
            state.links[idx] = { ...state.links[idx], ...body, id };
            persistState();
            return json(state.links[idx]);
          }
          if (method === "DELETE") {
            state.links.splice(idx, 1);
            persistState();
            return json({ ok: true });
          }
        }

        if (pathname === "/data/admin/links/reorder" && method === "PUT") {
          const { ids } = await readBody();
          if (Array.isArray(ids)) {
            state.links.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            state.links.forEach((l, i) => (l.sort_order = i + 1));
            persistState();
          }
          return json({ ok: true });
        }


        // Upload
        if (pathname === "/data/admin/upload" && method === "POST") {
          try {
            const rawBody = await readRawBody();
            const contentType = req.headers["content-type"] || "";

            if (!contentType.includes("multipart/form-data")) {
              return json({ error: "Envie um formulário multipart com o arquivo." }, 400);
            }

            const response = new Response(new Uint8Array(rawBody), {
              headers: { "content-type": contentType },
            });
            const formData = await response.formData();
            const file = formData.get("file");

            if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
              return json({ error: "Nenhum arquivo enviado no campo 'file'." }, 400);
            }

            const fileBlob = file as Blob & { name?: string };
            const originalName = fileBlob.name || "imagem.jpg";
            const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
            let ext = (extMatch ? extMatch[1] : "jpg").toLowerCase();
            if (ext === "jpeg") ext = "jpg";

            const buffer = Buffer.from(await fileBlob.arrayBuffer());
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
            const uploadDir = path.resolve(process.cwd(), "public", "uploads");

            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);

            return json({ url: `/uploads/${fileName}` });
          } catch (err: any) {
            console.error("Erro no upload mock:", err);
            return json({ error: "Falha ao processar o upload da imagem." }, 500);
          }
        }

        return json({ error: "Rota mock não encontrada." }, 404);
      });
    },
  };
}
