import { useEffect, useRef, useState } from 'react';
import { captureFromDrop, captureFromPaste, nameFromFile, parseCapture, prepareCaptureFile, shareRecordToCaptures } from '../lib/shoppingCapture';
import { deleteShare, listShares } from '../lib/shareInbox';

const seenShares = new Set();
const recentCaptures = new Map();
let shareQueue = Promise.resolve();

function capturedRecently(key) {
  const at = recentCaptures.get(key) || 0;
  return Date.now() - at < 2000;
}

function enqueueShareRead(run) {
  shareQueue = shareQueue.then(run, run);
  return shareQueue;
}

function partToFile(part) {
  const blob = part?.blob || part;
  if (!blob) return null;
  const type = part?.type || blob.type || '';
  const name = part?.name || blob.name || 'photo.jpg';
  if (typeof File !== 'function') return blob;
  try {
    return new File([blob], name, { type });
  } catch {
    return blob;
  }
}

function imageContext(draft) {
  const typed = (draft || '').trim();
  if (!typed) return { name: '', url: '' };
  const parsed = parseCapture(typed);
  if (!parsed) return { name: '', url: '' };
  if (!parsed.url) return { name: parsed.name, url: '' };
  const remainder = typed.replace(parsed.url, '').replace(/^https?:\/\//i, '').trim();
  if (remainder) return { name: parsed.name, url: parsed.url };
  return { name: '', url: parsed.url };
}

async function saveCapture(onCapture, input) {
  if (!input?.name && !input?.url && !input?.file) return false;
  return onCapture(input);
}

export function useCaptureInbox({ getDraft, setDraft, onCapture, paused }) {
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState('');
  const onCaptureRef = useRef(onCapture);
  const pausedRef = useRef(paused);
  const dragDepth = useRef(0);
  const recent = useRef({ key: '', at: 0 });
  onCaptureRef.current = onCapture;
  pausedRef.current = paused;

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/shopping.webmanifest';
    document.head.appendChild(link);

    const icon = document.createElement('link');
    icon.rel = 'apple-touch-icon';
    icon.href = '/shopping-icon-192.png';
    document.head.appendChild(icon);

    const theme = document.querySelector('meta[name="theme-color"]');
    const createdTheme = !theme;
    const themeMeta = theme || document.createElement('meta');
    const previousTheme = themeMeta.getAttribute('content');
    if (createdTheme) {
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', '#000000');

    let cancelled = false;
    const onMessage = (event) => {
      if (event.data?.type === 'shopping-share') ingest();
    };

    const ingest = () => enqueueShareRead(async () => {
      const records = await listShares();
      if (cancelled) return;
      for (const record of records) {
        if (cancelled || !record?.id || seenShares.has(record.id)) continue;
        seenShares.add(record.id);
        const captures = shareRecordToCaptures({
          ...record,
          files: (record.files || []).map(partToFile).filter(Boolean)
        });
        if (captures.length === 0) {
          await deleteShare(record.id);
          continue;
        }
        let saved = false;
        for (const capture of captures) {
          const key = `${capture.name}|${capture.url}|${capture.file?.name || ''}|${capture.file?.size || 0}`;
          if (capturedRecently(key)) {
            saved = true;
            continue;
          }
          const ok = await onCaptureRef.current(capture);
          saved = saved || Boolean(ok);
          if (ok) {
            recentCaptures.set(key, Date.now());
            setNotice(`Saved ${capture.name}`);
          }
        }
        if (saved) await deleteShare(record.id);
        else seenShares.delete(record.id);
      }
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/share-sw.js', { scope: '/shopping' })
        .catch(() => navigator.serviceWorker.register('/share-sw.js'))
        .catch(() => {});
      navigator.serviceWorker.addEventListener('message', onMessage);
    }
    ingest();

    return () => {
      cancelled = true;
      link.remove();
      icon.remove();
      if (createdTheme) themeMeta.remove();
      else if (previousTheme == null) themeMeta.removeAttribute('content');
      else themeMeta.setAttribute('content', previousTheme);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onMessage);
      }
    };
  }, []);

  useEffect(() => {
    const remember = (key) => {
      const now = Date.now();
      if (recent.current.key === key && now - recent.current.at < 1200) return false;
      recent.current = { key, at: now };
      return true;
    };

    const announce = (input, saved) => {
      if (saved) setNotice(`Saved ${input.name}`);
    };

    const saveFiles = async (files, context) => {
      let index = 0;
      let anySaved = false;
      for (const file of files.slice(0, 4)) {
        const prepared = prepareCaptureFile(file);
        const name = (index === 0 && context.name) ? context.name : nameFromFile(file);
        const url = index === 0 ? context.url : '';
        const key = `${name}|${url}|${file.size}|${file.type}`;
        if (!remember(key)) {
          index += 1;
          continue;
        }
        const saved = await saveCapture(onCaptureRef.current, {
          name,
          url,
          file: prepared.file,
          problem: prepared.problem
        });
        if (saved) anySaved = true;
        announce({ name }, saved);
        index += 1;
      }
      if (anySaved) {
        setDraft('');
        document.getElementById('shopping-capture')?.focus();
      }
    };

    const onPaste = (event) => {
      if (pausedRef.current) return;
      const target = event.target;
      if (target instanceof Element) {
        if (target.closest('[role="dialog"], textarea')) return;
        if (target.closest('input, select') && target.id !== 'shopping-capture') return;
      }

      const imageItem = [...(event.clipboardData?.items || [])]
        .find((item) => item.kind === 'file' && item.type.startsWith('image/'));
      const image = imageItem?.getAsFile?.()
        || [...(event.clipboardData?.files || [])].find((file) => file.type.startsWith('image/'))
        || null;
      if (image) {
        event.preventDefault();
        saveFiles([image], imageContext(getDraft()));
        return;
      }

      const text = event.clipboardData?.getData('text/plain') || '';
      const captured = captureFromPaste(getDraft(), text);
      if (!captured) return;
      if (!remember(`${captured.name}|${captured.url}`)) return;
      event.preventDefault();
      const previous = getDraft();
      setDraft('');
      saveCapture(onCaptureRef.current, captured).then((saved) => {
        if (!saved) setDraft(captured.url ? `${previous} ${captured.url}`.trim() : previous);
        else document.getElementById('shopping-capture')?.focus();
        announce(captured, saved);
      });
    };

    const wantsDrop = (dataTransfer) => {
      const types = [...(dataTransfer?.types || [])];
      return types.includes('Files') || types.includes('text/uri-list');
    };

    const onDragEnter = (event) => {
      if (pausedRef.current || !wantsDrop(event.dataTransfer)) return;
      dragDepth.current += 1;
      setDragging(true);
    };

    const onDragOver = (event) => {
      if (pausedRef.current || !wantsDrop(event.dataTransfer)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };

    const onDrop = (event) => {
      dragDepth.current = 0;
      setDragging(false);
      if (pausedRef.current) return;
      const types = [...(event.dataTransfer?.types || [])];
      const files = [...(event.dataTransfer?.files || [])].filter((file) => file.type.startsWith('image/'));
      const rawText = types.includes('text/uri-list')
        ? event.dataTransfer.getData('text/uri-list')
        : event.dataTransfer?.getData('text/plain') || '';
      const captured = captureFromDrop(getDraft(), rawText);
      if (files.length === 0 && !captured?.url && !types.includes('text/uri-list') && !types.includes('Files')) return;
      if (files.length === 0 && !captured?.url) return;
      event.preventDefault();
      if (files.length) {
        const context = imageContext(getDraft());
        saveFiles(files, { name: context.name, url: captured?.url || context.url });
        return;
      }
      if (!captured || !remember(`${captured.name}|${captured.url}`)) return;
      const previous = getDraft();
      setDraft('');
      saveCapture(onCaptureRef.current, captured).then((saved) => {
        if (!saved) setDraft(captured.url ? `${previous} ${captured.url}`.trim() : previous);
        else document.getElementById('shopping-capture')?.focus();
        announce(captured, saved);
      });
    };

    document.addEventListener('paste', onPaste);
    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  }, [getDraft, setDraft]);

  return { dragging, notice };
}
