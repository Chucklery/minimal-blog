// imageUpload.js — click / drag-drop / paste image upload
export function initImageUpload({ editor, toast }) {

  async function uploadFile(file) {
    if (!file || !file.type.startsWith('image/')) return null;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) return data.data.filepath;
      toast('Upload failed', true);
    } catch { toast('Network error', true); }
    return null;
  }

  // Paste
  document.addEventListener('paste', async e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const url = await uploadFile(item.getAsFile());
        if (url) insertMd(`![image](${url})`);
        return;
      }
    }
  });

  // Drag & drop
  const editorEl = document.getElementById('editor');
  editorEl.addEventListener('dragover', e => { e.preventDefault(); });
  editorEl.addEventListener('drop', async e => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    const url = await uploadFile(file);
    if (url) insertMd(`![image](${url})`);
  });

  // Click toolbar button (exposed globally so editor toolbar can call it)
  window.__uploadImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const url = await uploadFile(input.files[0]);
      if (url) insertMd(`![image](${url})`);
    };
    input.click();
  };
}

function insertMd(text) {
  const { editor, editorEl } = window.__editor__;
  editor.action(ctx => {
    const { state, dispatch } = ctx.view;
    const { from, to } = state.selection;
    const tr = state.tr.insertText(text, from, Math.max(from, to));
    dispatch(tr);
  });
  editorEl.focus();
}
