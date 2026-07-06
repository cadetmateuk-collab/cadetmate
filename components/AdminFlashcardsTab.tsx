'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Trash2, Pencil, Check, X, Upload, BookOpen,
  Sparkles, Copy, Eye, EyeOff, Crown, Layers,
} from 'lucide-react';

const supabase = createClient();

const C = {
  bg: '#ffffff', fg: '#0f0f0f', primary: '#2966f4', primaryLight: '#eef2fe',
  muted: '#f7f7f8', mutedFg: '#737373', border: '#e8e8e8',
  green: '#16a34a', greenLight: '#f0fdf4', red: '#dc2626', redLight: '#fef2f2',
  amber: '#b45309', amberLight: '#fef3c7', gold: '#f59e0b',
  radius: '10px', radiusSm: '6px',
};

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type Status = 'draft' | 'published' | 'archived';
type CardType = 'standard' | 'image' | 'reverse' | 'multiple_choice';

interface Pack {
  id: string; slug: string; title: string; description: string;
  category: string; tags: string[]; difficulty: Difficulty;
  thumbnail_url?: string | null; is_premium: boolean; price_cents: number;
  stripe_price_id?: string | null; status: Status; card_count: number;
}
interface Card {
  id: string; pack_id: string; position: number; card_type: CardType;
  front: string; back: string; hint?: string | null; image_url?: string | null;
  tags: string[]; difficulty: Difficulty;
}

function Btn({ onClick, disabled, variant = 'primary', children, type = 'button', style }: any) {
  const v: Record<string, any> = {
    primary: { background: C.primary, color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: C.mutedFg, border: `1px solid ${C.border}` },
    danger:  { background: C.redLight, color: C.red, border: `1px solid ${C.red}33` },
    success: { background: C.greenLight, color: C.green, border: `1px solid ${C.green}33` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
      borderRadius: C.radiusSm, fontSize: 12, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1,
      fontFamily: 'inherit', transition: 'opacity .15s', ...v[variant], ...style,
    }}>{children}</button>
  );
}
function Input({ value, onChange, placeholder, type = 'text' }: any) {
  return <input type={type} value={value ?? ''} placeholder={placeholder}
    onChange={(e) => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value)}
    style={{
      width: '100%', padding: '7px 10px', borderRadius: C.radiusSm,
      fontSize: 12, border: `1px solid ${C.border}`, background: C.bg, color: C.fg,
      fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
    }} />;
}
function Textarea({ value, onChange, rows = 3, placeholder }: any) {
  return <textarea value={value ?? ''} rows={rows} placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%', padding: '8px 10px', fontSize: 12, lineHeight: 1.6,
      border: `1px solid ${C.border}`, borderRadius: C.radiusSm, background: C.bg,
      color: C.fg, fontFamily: 'inherit', outline: 'none', resize: 'vertical',
      boxSizing: 'border-box',
    }} />;
}
function Select({ value, onChange, options }: any) {
  return <select value={value} onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%', padding: '7px 10px', borderRadius: C.radiusSm, fontSize: 12,
      border: `1px solid ${C.border}`, background: C.bg, color: C.fg,
      fontFamily: 'inherit', outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
    }}>
    {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
  </select>;
}
function Badge({ children, color, bg }: any) {
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 7px', borderRadius: 20, fontSize: 10,
    fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase',
    background: bg ?? (color + '15'), color, whiteSpace: 'nowrap',
  }}>{children}</span>;
}

const difficultyColor: Record<Difficulty, string> = {
  beginner: C.green, intermediate: C.primary, advanced: C.red,
};

export default function AdminFlashcardsTab() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Pack | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from('flashcard_packs').select('*').order('updated_at', { ascending: false });
    setPacks((data ?? []) as Pack[]);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function fetchStripePrice(priceId: string) {
    if (!priceId.startsWith('price_')) {
      alert('That doesn\'t look like a Price ID — it should start with price_');
      return;
    }
    setStripeLoading(true);
    try {
      const res = await fetch(`/api/stripe-price?priceId=${encodeURIComponent(priceId)}`);
      if (!res.ok) { alert('Could not fetch price from Stripe — check the ID is correct'); return; }
      const { unit_amount } = await res.json();
      setEditing((e) => e ? { ...e, price_cents: unit_amount, stripe_price_id: priceId } : e);
    } catch {
      alert('Failed to reach Stripe');
    } finally {
      setStripeLoading(false);
    }
  }


  async function openPack(p: Pack) {
    setEditing(p);
    const { data } = await supabase.from('flashcards').select('*').eq('pack_id', p.id).order('position');
    setCards((data ?? []) as Card[]);
  }

  async function createPack() {
    const slug = `pack-${Date.now().toString(36)}`;
    const { data, error } = await supabase.from('flashcard_packs').insert({
      slug, title: 'Untitled pack', description: '', category: 'General',
      difficulty: 'beginner', status: 'draft',
    }).select().single();
    if (error) return alert(error.message);
    refresh(); openPack(data as Pack);
  }

  async function savePack() {
    if (!editing) return;
    const { error } = await supabase.from('flashcard_packs').update({
      slug: editing.slug, title: editing.title, description: editing.description,
      category: editing.category, tags: editing.tags, difficulty: editing.difficulty,
      thumbnail_url: editing.thumbnail_url, is_premium: editing.is_premium,
      price_cents: editing.price_cents, stripe_price_id: editing.stripe_price_id, status: editing.status,
      card_count: cards.length,
    }).eq('id', editing.id);
    if (error) return alert(error.message);
    await refresh();
    alert('Saved');
  }

  async function deletePack(p: Pack) {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await supabase.from('flashcard_packs').delete().eq('id', p.id);
    if (editing?.id === p.id) setEditing(null);
    refresh();
  }

  async function clonePack(p: Pack) {
    const { data } = await supabase.from('flashcard_packs').insert({
      ...p, id: undefined, slug: p.slug + '-copy-' + Date.now().toString(36),
      title: p.title + ' (copy)', status: 'draft',
    } as any).select().single();
    refresh();
    if (data) openPack(data as Pack);
  }

  async function toggleStatus(p: Pack) {
    const next: Status = p.status === 'published' ? 'draft' : 'published';
    await supabase.from('flashcard_packs').update({ status: next }).eq('id', p.id);
    refresh();
    if (editing?.id === p.id) setEditing({ ...editing, status: next });
  }

  async function addCard() {
    if (!editing) return;
    const { data } = await supabase.from('flashcards').insert({
      pack_id: editing.id, position: cards.length,
      card_type: 'standard', front: '', back: '',
    }).select().single();
    if (data) setCards((cs) => [...cs, data as Card]);
  }
  async function saveCard(c: Card) {
    await supabase.from('flashcards').update({
      front: c.front, back: c.back, hint: c.hint, image_url: c.image_url,
      card_type: c.card_type, position: c.position, tags: c.tags, difficulty: c.difficulty,
    }).eq('id', c.id);
  }
  async function deleteCard(id: string) {
    await supabase.from('flashcards').delete().eq('id', id);
    setCards((cs) => cs.filter((x) => x.id !== id));
  }

  const fileRef = useRef<HTMLInputElement>(null);
  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editing) return;
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    const cols = header.toLowerCase().split(',').map((s) => s.trim());
    const fi = cols.indexOf('term') >= 0 ? cols.indexOf('term') : cols.indexOf('front');
    const bi = cols.indexOf('definition') >= 0 ? cols.indexOf('definition') : cols.indexOf('back');
    if (fi < 0 || bi < 0) return alert('CSV must have term/definition or front/back columns');
    const inserts = rows.map((line, i) => {
      const parts = line.split(',').map((s) => s.replace(/^"|"$/g, ''));
      return { pack_id: editing.id, position: cards.length + i, card_type: 'standard' as const, front: parts[fi] ?? '', back: parts[bi] ?? '' };
    });
    const { error } = await supabase.from('flashcards').insert(inserts);
    if (error) return alert(error.message);
    openPack(editing);
  }

  // ─── Edit view ───────────────────────────────────────────────
  if (editing) {
    return (
      <div style={{ fontFamily: 'inherit', color: C.fg }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
        }}>
          <Btn variant="ghost" onClick={() => { setEditing(null); refresh(); }}><X size={12} /> Back</Btn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
              background: editing.thumbnail_url ? `center/cover no-repeat url(${editing.thumbnail_url})` : `linear-gradient(135deg, ${C.primary}22, ${C.primary}44)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${C.border}`,
            }}>
              {!editing.thumbnail_url && <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{editing.title.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}</span>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{editing.title}</div>
              <div style={{ fontSize: 11, color: C.mutedFg }}>{editing.slug}</div>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Badge color={editing.status === 'published' ? C.green : C.amber}>{editing.status}</Badge>
            <Btn variant={editing.status === 'published' ? 'ghost' : 'success'} onClick={() => toggleStatus(editing)}>
              {editing.status === 'published' ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
            </Btn>
            <Btn onClick={savePack}><Check size={12} /> Save changes</Btn>
          </div>
        </div>

        {/* Two-column: cover left, fields right */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={lbl}>Cover image</div>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
              border: `2px dashed ${C.border}`, background: C.muted,
              backgroundImage: editing.thumbnail_url ? `url(${editing.thumbnail_url})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!editing.thumbnail_url && (
                <div style={{ textAlign: 'center', color: C.mutedFg }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: C.primary + '44' }}>
                    {editing.title.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 4 }}>No image</div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={lbl}>Image URL</div>
              <Input value={editing.thumbnail_url ?? ''} onChange={(v: string) => setEditing({ ...editing, thumbnail_url: v })} placeholder="https://…" />
            </div>
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 10,
              border: `1px solid ${editing.is_premium ? C.gold + '55' : C.border}`,
              background: editing.is_premium ? C.amberLight : C.muted,
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.is_premium}
                  onChange={(e) => setEditing({ ...editing, is_premium: e.target.checked })}
                  style={{ accentColor: C.gold, width: 14, height: 14 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Crown size={13} color={C.gold} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: editing.is_premium ? C.amber : C.mutedFg }}>Premium pack</span>
                </div>
              </label>
              {editing.is_premium && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Stripe Price ID with lookup */}
                  <div>
                    <div style={lbl}>Stripe Price ID</div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <input
                        value={editing.stripe_price_id ?? ''}
                        onChange={(e) => setEditing({ ...editing, stripe_price_id: e.target.value })}
                        placeholder="price_1ABC…"
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: C.radiusSm,
                          fontSize: 12, border: `1px solid ${C.border}`, background: C.bg,
                          color: C.fg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
                        }}
                      />
                      <button
                        onClick={() => editing.stripe_price_id && fetchStripePrice(editing.stripe_price_id)}
                        disabled={stripeLoading || !editing.stripe_price_id}
                        title="Fetch price from Stripe"
                        style={{
                          padding: '7px 10px', borderRadius: C.radiusSm, fontSize: 11, fontWeight: 600,
                          background: C.primaryLight, color: C.primary, border: `1px solid ${C.primary}33`,
                          cursor: stripeLoading || !editing.stripe_price_id ? 'not-allowed' : 'pointer',
                          opacity: stripeLoading || !editing.stripe_price_id ? 0.5 : 1,
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {stripeLoading ? '…' : '↓ Fetch'}
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: C.mutedFg, marginTop: 3 }}>
                      Paste the <code>price_1…</code> ID from Stripe → Product catalogue → Pricing
                    </div>
                  </div>
                  {/* Price display (auto-filled by fetch, or manual override) */}
                  <div>
                    <div style={lbl}>Price (pence) — e.g. 499 = £4.99</div>
                    <Input type="number" value={editing.price_cents} onChange={(v: number) => setEditing({ ...editing, price_cents: v })} />
                  </div>
                  {editing.price_cents > 0 && (
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>
                      = £{(editing.price_cents / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{
            padding: 16, border: `1px solid ${C.border}`, borderRadius: 12,
            background: C.bg, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start',
          }}>
            <div><div style={lbl}>Title</div><Input value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} /></div>
            <div><div style={lbl}>Slug</div><Input value={editing.slug} onChange={(v: string) => setEditing({ ...editing, slug: v })} /></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={lbl}>Description</div>
              <Textarea value={editing.description} onChange={(v: string) => setEditing({ ...editing, description: v })} />
            </div>
            <div><div style={lbl}>Category</div><Input value={editing.category} onChange={(v: string) => setEditing({ ...editing, category: v })} /></div>
            <div><div style={lbl}>Difficulty</div>
              <Select value={editing.difficulty} onChange={(v: any) => setEditing({ ...editing, difficulty: v })} options={['beginner','intermediate','advanced']} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={lbl}>Tags (comma-separated)</div>
              <Input value={(editing.tags ?? []).join(', ')} onChange={(v: string) => setEditing({ ...editing, tags: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="navigation, charts, rules…" />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <Layers size={14} color={C.primary} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Cards</span>
          <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: C.primaryLight, color: C.primary }}>{cards.length}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <Btn variant="ghost" onClick={() => fileRef.current?.click()}><Upload size={12} /> Import CSV</Btn>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            <Btn onClick={addCard}><Plus size={12} /> Add card</Btn>
          </div>
        </div>

        {cards.length === 0 && (
          <div style={{ padding: 36, textAlign: 'center', borderRadius: 12, background: C.muted, color: C.mutedFg, fontSize: 12, border: `1px dashed ${C.border}` }}>
            <BookOpen size={22} style={{ opacity: .3, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No cards yet</div>
            <div style={{ opacity: .7 }}>Add manually or import a CSV with <code>Term,Definition</code> columns.</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cards.map((c, i) => (
            <CardRow key={c.id} card={c} index={i}
              onChange={(next) => { setCards((cs) => cs.map((x) => x.id === c.id ? next : x)); saveCard(next); }}
              onDelete={() => deleteCard(c.id)} />
          ))}
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────
  const published = packs.filter(p => p.status === 'published').length;
  const drafts = packs.filter(p => p.status === 'draft').length;

  return (
    <div style={{ fontFamily: 'inherit', color: C.fg }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Flashcard packs</div>
          <div style={{ fontSize: 11, color: C.mutedFg, marginTop: 2 }}>
            {published} published · {drafts} draft{drafts !== 1 ? 's' : ''}
          </div>
        </div>
        <Btn onClick={createPack}><Plus size={12} /> New pack</Btn>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 140, borderRadius: 12, background: C.muted, opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {packs.map((p) => (
            <div key={p.id} style={{
              borderRadius: 12, border: `1px solid ${C.border}`,
              background: C.bg, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}>
              {/* Cover */}
              <div style={{
                height: 110, position: 'relative', flexShrink: 0,
                background: p.thumbnail_url
                  ? `center/cover no-repeat url(${p.thumbnail_url})`
                  : `linear-gradient(135deg, ${C.primary}18 0%, ${C.primary}30 100%)`,
              }}>
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  <Badge
                    color={p.status === 'published' ? C.green : p.status === 'archived' ? C.mutedFg : C.amber}
                    bg={p.status === 'published' ? '#dcfce7' : p.status === 'archived' ? '#f5f5f5' : '#fef3c7'}
                  >{p.status}</Badge>
                </div>
                {p.is_premium && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 26, height: 26, borderRadius: 8,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(245,158,11,.4)',
                  }}>
                    <Crown size={13} color="#fff" />
                  </div>
                )}
                {!p.thumbnail_url && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: C.primary + '55', letterSpacing: -1 }}>
                      {p.title.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '10px 12px', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, marginBottom: 5 }}>{p.title}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                  <Badge color={C.primary}>{p.category}</Badge>
                  <Badge color={difficultyColor[p.difficulty]}>{p.difficulty}</Badge>
                </div>
                {p.description && (
                  <p style={{
                    fontSize: 11, color: C.mutedFg, margin: 0, lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{p.description}</p>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '8px 12px', borderTop: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 5, background: C.muted,
              }}>
                <span style={{ fontSize: 11, color: C.mutedFg, flex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Layers size={10} />
                  {p.card_count} cards
                </span>
                <Btn variant="ghost" onClick={() => toggleStatus(p)} style={{
                  fontSize: 11, padding: '4px 8px',
                  color: p.status === 'published' ? C.red : C.green,
                  borderColor: p.status === 'published' ? C.red + '33' : C.green + '33',
                }}>
                  {p.status === 'published' ? <><EyeOff size={10} /> Unpublish</> : <><Eye size={10} /> Publish</>}
                </Btn>
                <Btn variant="ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => clonePack(p)}><Copy size={10} /></Btn>
                <Btn variant="ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openPack(p)}><Pencil size={10} /> Edit</Btn>
                <Btn variant="danger" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => deletePack(p)}><Trash2 size={10} /></Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const lbl: any = {
  fontSize: 10, fontWeight: 700, color: C.mutedFg,
  textTransform: 'uppercase', letterSpacing: '.06em',
  display: 'block', marginBottom: 4,
};

function CardRow({ card, index, onChange, onDelete }: {
  card: Card; index: number; onChange: (c: Card) => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.bg, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px',
        background: C.muted, borderBottom: open ? `1px solid ${C.border}` : 'none',
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: C.primaryLight,
          color: C.primary, fontSize: 10, fontWeight: 700, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{index + 1}</span>
        <Select value={card.card_type} onChange={(v: any) => onChange({ ...card, card_type: v })}
          options={['standard','image','reverse','multiple_choice']} />
        <Btn variant="ghost" style={{ fontSize: 11, padding: '4px 9px' }} onClick={() => setOpen((o) => !o)}>
          {open ? 'Collapse' : 'Expand'}
        </Btn>
        <Btn variant="danger" style={{ marginLeft: 'auto', fontSize: 11, padding: '4px 8px' }} onClick={onDelete}><Trash2 size={11} /></Btn>
      </div>
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><div style={lbl}>Front</div><Textarea value={card.front} onChange={(v: string) => onChange({ ...card, front: v })} /></div>
        <div><div style={lbl}>Back (Markdown)</div><Textarea value={card.back} onChange={(v: string) => onChange({ ...card, back: v })} rows={6} placeholder={'Supports Markdown:\n- Bullet lists\n1. Numbered lists\n- [ ] Checklists\n## Headings\n**bold** *italic* ++underline++\n==highlight==\n![diagram](url)\n<details><summary>More</summary>...</details>'} /></div>
        {open && (
          <>
            <div><div style={lbl}>Hint</div><Input value={card.hint ?? ''} onChange={(v: string) => onChange({ ...card, hint: v })} /></div>
            <div><div style={lbl}>Image URL</div><Input value={card.image_url ?? ''} onChange={(v: string) => onChange({ ...card, image_url: v })} /></div>
            <div><div style={lbl}>Difficulty</div>
              <Select value={card.difficulty} onChange={(v: any) => onChange({ ...card, difficulty: v })} options={['beginner','intermediate','advanced']} />
            </div>
            <div><div style={lbl}>Tags</div>
              <Input value={(card.tags ?? []).join(', ')} onChange={(v: string) => onChange({ ...card, tags: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}