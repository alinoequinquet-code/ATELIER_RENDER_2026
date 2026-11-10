import { useCallback, useEffect, useState } from 'react';

// Les appels passent par l'appli (window.B2T.api) : ils portent la session du compte connecté
const api = (path, options) => window.B2T.api(path, options);

const fmt = (iso) => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

// Fenêtre « Serveur du club » : ouverte par le bouton de la page Sauvegarde (évènement b2t:cloud)
export default function CloudSync() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [slow, setSlow] = useState(false);
  const [msg, setMsg] = useState(null);
  const [list, setList] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    const show = () => { setOpen(true); setMsg(null); setConfirmId(null); };
    window.addEventListener('b2t:cloud', show);
    return () => window.removeEventListener('b2t:cloud', show);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const run = useCallback(async (kind, fn) => {
    setBusy(kind); setSlow(false); setMsg(null);
    const t = setTimeout(() => setSlow(true), 3000);
    try { await fn(); } catch (e) { setMsg({ err: true, text: e.message || 'Erreur inattendue.' }); } finally { clearTimeout(t); setBusy(''); setSlow(false); }
  }, []);

  const loadList = useCallback(async () => {
    const r = await api('/api/backups?limit=8');
    setList(r.items);
  }, []);

  useEffect(() => {
    if (open) run('list', loadList);
  }, [open, run, loadList]);

  const sync = () => run('sync', async () => {
    const B = window.B2T;
    const latest = await api('/api/backups/latest');
    let r = null;
    if (latest.item) r = await B.applyCloud(latest.item.data, 'merge');
    const saved = await api('/api/backups', { method: 'POST', body: { device: B.device() || 'Appareil sans nom', data: B.backupData() } });
    B.markCloudSaved();
    const got = r ? r.addP + r.updP + r.addM + r.updM + r.delM : 0;
    setMsg({ text: `Synchronisé : ${plural(saved.item.players, 'joueur')} et ${plural(saved.item.matches, 'match')} sur le serveur.${r ? (got ? ` Récupéré des autres appareils : ${r.addP} joueur(s) ajouté(s), ${r.updP} mis à jour, ${r.addM} match(s) ajouté(s), ${r.updM} mis à jour${r.delM ? `, ${r.delM} supprimé(s)` : ''}.` : ' Rien de nouveau venant des autres appareils.') : ''}` });
    await loadList();
  });

  const restore = (id) => run('restore', async () => {
    const r = await api(`/api/backups/${id}`);
    await window.B2T.applyCloud(r.item.data, 'replace');
    setConfirmId(null);
    setMsg({ text: `Données de cet appareil remplacées par la version du ${fmt(r.item.created_at)} (${r.item.device || 'appareil sans nom'}). Une copie automatique a été faite juste avant.` });
  });

  if (!open) return null;
  const user = window.B2T.user();
  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="card cloud" role="dialog" aria-modal="true" aria-labelledby="cloud-title">
        <div className="card-head">
          <h2 id="cloud-title">Serveur du club</h2>
          <button className="icon-btn" type="button" aria-label="Fermer" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="row">
          <button className="btn primary" type="button" disabled={!!busy} onClick={sync}>{busy === 'sync' ? 'Synchronisation…' : 'Synchroniser maintenant'}</button>
        </div>
        <p className="hint">Récupère ce que les autres appareils ont envoyé, le fusionne avec cet iPad, puis envoie le tout sur le serveur.{user ? ` Connecté : ${user.name || user.username}.` : ''}</p>

        {slow && <p className="hint cloud-wait">Le serveur se réveille, ça peut prendre jusqu’à une minute…</p>}
        {msg && <p className={msg.err ? 'err' : 'cloud-ok'} role="status">{msg.text}</p>}

        <div className="cloud-list">
          <h3>Versions sur le serveur</h3>
          {list === null ? <p className="hint">{busy === 'list' ? 'Chargement…' : '—'}</p>
            : !list.length ? <p className="hint">Rien sur le serveur pour l’instant. Touche « Synchroniser maintenant » pour y envoyer tes données.</p>
              : (
                <ul className="snaps">
                  {list.map((it) => (
                    <li key={it.id}>
                      <span className="si"><b>{fmt(it.created_at)}</b><small>{it.device || 'Appareil sans nom'} · {plural(it.players, 'joueur')} · {plural(it.matches, 'match')}</small></span>
                      {confirmId === it.id ? (
                        <>
                          <button className="btn sm primary" type="button" disabled={!!busy} onClick={() => restore(it.id)}>Confirmer</button>
                          <button className="btn sm ghost" type="button" onClick={() => setConfirmId(null)}>Annuler</button>
                        </>
                      ) : (
                        <button className="btn sm" type="button" disabled={!!busy} onClick={() => setConfirmId(it.id)}>Remplacer mes données par celle-ci</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
        </div>
      </div>
    </div>
  );
}
