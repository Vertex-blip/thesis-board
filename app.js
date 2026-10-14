/* ThesisBoard stores research locally; no external service or API is used. */
const KEY = 'thesisboard.projects.v1';
const ACTIVE_KEY = 'thesisboard.active.v1';
const STAGES = ['Discover', 'Frame', 'Collect', 'Write', 'Review'];
const el = id => document.getElementById(id);
const text = (value, max = 4000) => typeof value === 'string' ? value.slice(0, max) : '';
const makeId = () => crypto.randomUUID();
let projects = readProjects();
let activeId = localStorage.getItem(ACTIVE_KEY);
let activeTab = 'overview';
let editingId = null;
let toastTimer;

function validUrl(raw) { if (!raw) return true; try { return ['https:', 'http:'].includes(new URL(raw).protocol); } catch { return false; } }
function safeDate(raw) { return /^\d{4}-\d{2}-\d{2}$/.test(raw || '') ? raw : ''; }
function sanitizeProject(project) {
  return {
    id: text(project.id, 80) || makeId(), title: text(project.title, 120), question: text(project.question, 500),
    field: text(project.field, 80), deadline: safeDate(project.deadline), summary: text(project.summary),
    stage: STAGES.includes(project.stage) ? project.stage : STAGES[0],
    sources: Array.isArray(project.sources) ? project.sources.filter(source => source && typeof source.title === 'string').map(source => ({ id: text(source.id, 80) || makeId(), title: text(source.title, 180), author: text(source.author, 120), year: Number.isInteger(source.year) && source.year >= 1500 && source.year <= 2100 ? source.year : null, type: ['Article','Book','Study','Dataset','Other'].includes(source.type) ? source.type : 'Other', url: validUrl(source.url) ? text(source.url, 500) : '', note: text(source.note, 1500) })).slice(0, 1000) : [],
    outline: Array.isArray(project.outline) ? project.outline.filter(section => section && typeof section.title === 'string').map(section => ({ id: text(section.id, 80) || makeId(), title: text(section.title, 180), body: text(section.body, 8000) })).slice(0, 1000) : [],
    tasks: Array.isArray(project.tasks) ? project.tasks.filter(task => task && typeof task.title === 'string').map(task => ({ id: text(task.id, 80) || makeId(), title: text(task.title, 180), done: task.done === true })).slice(0, 1000) : []
  };
}
function readProjects() { try { const data = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(data) ? data.filter(p => p && typeof p.title === 'string' && typeof p.question === 'string').map(sanitizeProject) : []; } catch { return []; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(projects)); if (activeId) localStorage.setItem(ACTIVE_KEY, activeId); else localStorage.removeItem(ACTIVE_KEY); return true; } catch { toast('Storage is unavailable. Export a backup before leaving.'); return false; } }
function current() { return projects.find(project => project.id === activeId); }
function toast(message) { const node = el('toast'); node.textContent = message; node.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('visible'), 3600); }

function renderSidebar() {
  const list = el('project-list'); list.replaceChildren();
  if (!projects.length) { const empty = document.createElement('p'); empty.className = 'sidebar-empty'; empty.textContent = 'No projects yet.'; list.append(empty); return; }
  projects.forEach((project, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = `project-nav${project.id === activeId ? ' active' : ''}`;
    const icon = document.createElement('span'); icon.className = 'project-nav-icon'; icon.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span'); label.className = 'project-nav-label'; label.textContent = project.title;
    button.append(icon, label); button.addEventListener('click', () => { activeId = project.id; activeTab = 'overview'; save(); render(); el('sidebar').classList.remove('open'); }); list.append(button);
  });
}

function showTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  ['overview','sources','outline','tasks'].forEach(name => { el(`${name}-pane`).hidden = name !== tab; });
  el('breadcrumb-title').textContent = tab.toUpperCase();
}

function render() {
  if (!current() && projects.length) activeId = projects[0].id;
  const project = current(); renderSidebar(); el('welcome-view').hidden = !!project; el('project-view').hidden = !project;
  if (!project) { el('breadcrumb-title').textContent = 'OVERVIEW'; return; }
  el('project-field').textContent = (project.field || 'RESEARCH PROJECT').toUpperCase();
  el('project-title').textContent = project.title; el('project-question').textContent = project.question;
  el('overview-question').textContent = project.question; el('project-summary').value = project.summary;
  el('source-tab-count').textContent = String(project.sources.length); el('outline-tab-count').textContent = String(project.outline.length); el('task-tab-count').textContent = String(project.tasks.length);
  const done = project.tasks.filter(task => task.done).length, left = project.tasks.length - done, percent = project.tasks.length ? Math.round(done / project.tasks.length * 100) : 0;
  el('completion-value').textContent = `${percent}%`; el('completion-fill').style.width = `${percent}%`;
  el('source-count').textContent = String(project.sources.length); el('outline-count').textContent = String(project.outline.length); el('open-task-count').textContent = String(left); el('tasks-left').textContent = String(left);
  el('deadline-label').textContent = project.deadline ? new Date(`${project.deadline}T12:00:00`).toLocaleDateString(undefined, { day:'numeric', month:'long', year:'numeric' }) : 'No deadline set';
  renderStages(project); renderSources(project); renderOutline(project); renderTasks(project); showTab(activeTab);
}

function renderStages(project) {
  const list = el('stage-list'); list.replaceChildren();
  STAGES.forEach((stage, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = `stage-button${project.stage === stage ? ' active' : ''}`;
    const number = document.createElement('span'); number.textContent = `0${index + 1}`; button.append(number, document.createTextNode(stage));
    button.setAttribute('aria-pressed', String(project.stage === stage)); button.addEventListener('click', () => { project.stage = stage; save(); renderStages(project); toast(`Stage set to ${stage}.`); }); list.append(button); });
}

function emptyState(title, detail) { const box = document.createElement('div'); box.className = 'empty-collection'; const strong = document.createElement('strong'); strong.textContent = title; const p = document.createElement('p'); p.textContent = detail; box.append(strong, p); return box; }
function actionButton(label, fn) { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', fn); return button; }

function renderSources(project) {
  const list = el('source-list'), term = el('source-search').value.trim().toLowerCase(); list.replaceChildren();
  const filtered = project.sources.filter(source => [source.title, source.author, source.note, source.type].some(value => String(value || '').toLowerCase().includes(term)));
  el('source-list-count').textContent = `${filtered.length} SOURCE${filtered.length === 1 ? '' : 'S'}`;
  if (!filtered.length) { list.append(emptyState(term ? 'No sources match.' : 'Every project begins somewhere.', term ? 'Try a different search.' : 'Add your first useful source using the form.')); return; }
  filtered.forEach(source => {
    const card = document.createElement('article'); card.className = 'source-card';
    const top = document.createElement('div'); top.className = 'source-top'; const type = document.createElement('span'); type.className = 'source-type'; type.textContent = source.type.toUpperCase(); top.append(type);
    const title = document.createElement('h3'); title.textContent = source.title;
    const meta = document.createElement('p'); meta.textContent = [source.author, source.year].filter(Boolean).join(' · ') || 'Author and year not recorded';
    card.append(top, title, meta);
    if (source.note) { const note = document.createElement('p'); note.className = 'source-note'; note.textContent = source.note; card.append(note); }
    const actions = document.createElement('div'); actions.className = 'source-actions';
    if (source.url && validUrl(source.url)) { const link = document.createElement('a'); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Open source ↗'; actions.append(link); }
    actions.append(actionButton('Remove', () => { if (!confirm(`Remove “${source.title}” from this project?`)) return; project.sources = project.sources.filter(item => item.id !== source.id); save(); render(); toast('Source removed.'); }));
    card.append(actions); list.append(card);
  });
}

function renderOutline(project) {
  const list = el('outline-list'); list.replaceChildren(); el('outline-list-count').textContent = `${project.outline.length} SECTION${project.outline.length === 1 ? '' : 'S'}`;
  if (!project.outline.length) { list.append(emptyState('The first blank page.', 'Add a section and start with a rough idea. You can reorder it later.')); return; }
  project.outline.forEach((section, index) => {
    const card = document.createElement('article'); card.className = 'outline-card';
    const head = document.createElement('div'); head.className = 'outline-card-head'; const number = document.createElement('span'); number.className = 'outline-num'; number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('input'); title.value = section.title; title.maxLength = 180; title.setAttribute('aria-label', `Section ${index + 1} title`); title.placeholder = 'Section title'; title.addEventListener('input', () => { section.title = title.value; save(); }); head.append(number, title);
    const body = document.createElement('textarea'); body.value = section.body; body.maxLength = 8000; body.rows = 4; body.placeholder = 'Main point, evidence to include, questions to resolve…'; body.setAttribute('aria-label', `Section ${index + 1} notes`); body.addEventListener('input', () => { section.body = body.value; save(); });
    const actions = document.createElement('div'); actions.className = 'outline-actions';
    const up = actionButton('↑ Move up', () => moveSection(project, index, -1)); up.disabled = index === 0;
    const down = actionButton('↓ Move down', () => moveSection(project, index, 1)); down.disabled = index === project.outline.length - 1;
    const remove = actionButton('Remove', () => { if (!confirm(`Remove section “${section.title || 'Untitled'}”?`)) return; project.outline.splice(index, 1); save(); render(); }); actions.append(up, down, remove);
    card.append(head, body, actions); list.append(card);
  });
}
function moveSection(project, index, delta) { const next = index + delta; if (next < 0 || next >= project.outline.length) return; [project.outline[index], project.outline[next]] = [project.outline[next], project.outline[index]]; save(); renderOutline(project); }

function renderTasks(project) {
  const list = el('task-list'); list.replaceChildren();
  if (!project.tasks.length) { list.append(emptyState('One step at a time.', 'Add a concrete task, such as “Find three primary sources.”')); return; }
  project.tasks.forEach(task => {
    const row = document.createElement('div'); row.className = `task-row${task.done ? ' done' : ''}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done; checkbox.id = `task-${task.id}`;
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
    const label = document.createElement('label'); label.htmlFor = checkbox.id; label.textContent = task.title;
    const remove = actionButton('×', () => { project.tasks = project.tasks.filter(item => item.id !== task.id); save(); render(); }); remove.setAttribute('aria-label', `Remove ${task.title}`);
    row.append(checkbox, label, remove); list.append(row);
  });
}

function openProjectDialog(project = null) {
  editingId = project?.id || null; el('dialog-title').textContent = project ? 'Edit your project' : 'New research project'; el('dialog-submit').textContent = project ? 'Save changes' : 'Create project';
  el('dialog-project-title').value = project?.title || ''; el('dialog-question').value = project?.question || ''; el('dialog-field').value = project?.field || ''; el('dialog-deadline').value = project?.deadline || '';
  el('project-dialog').showModal(); el('dialog-project-title').focus();
}

el('project-form').addEventListener('submit', event => {
  event.preventDefault(); const title = el('dialog-project-title').value.trim(), question = el('dialog-question').value.trim();
  if (!title || !question) { toast('A title and research question are required.'); return; }
  let project = projects.find(item => item.id === editingId);
  if (!project) { project = sanitizeProject({ id: makeId(), title, question, field:'', deadline:'', summary:'', stage:'Discover', sources:[], outline:[], tasks:[] }); projects.unshift(project); }
  project.title = title; project.question = question; project.field = el('dialog-field').value.trim(); project.deadline = el('dialog-deadline').value;
  activeId = project.id; activeTab = 'overview'; save(); render(); el('project-dialog').close(); toast(editingId ? 'Project updated.' : 'Project created.');
});
el('close-dialog').addEventListener('click', () => el('project-dialog').close()); el('cancel-dialog').addEventListener('click', () => el('project-dialog').close());
['sidebar-add','new-project-button','welcome-create'].forEach(id => el(id).addEventListener('click', () => openProjectDialog()));
el('edit-project').addEventListener('click', () => openProjectDialog(current()));
el('delete-project').addEventListener('click', () => { const project = current(); if (!project || !confirm(`Delete “${project.title}” and all its research data?`)) return; projects = projects.filter(item => item.id !== project.id); activeId = projects[0]?.id || null; activeTab = 'overview'; save(); render(); toast('Project deleted.'); });
document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
el('project-summary').addEventListener('input', event => { const project = current(); if (project) { project.summary = event.target.value; save(); } });
el('source-search').addEventListener('input', () => { const project = current(); if (project) renderSources(project); });
el('source-form').addEventListener('submit', event => {
  event.preventDefault(); const project = current(); if (!project) return;
  const title = el('source-title').value.trim(), url = el('source-url').value.trim(), yearValue = el('source-year').value;
  if (!title) { toast('Add a source title.'); return; } if (!validUrl(url)) { toast('Use a full http:// or https:// link.'); return; }
  const year = yearValue ? Number(yearValue) : null; if (yearValue && (!Number.isInteger(year) || year < 1500 || year > 2100)) { toast('Enter a year from 1500 to 2100.'); return; }
  project.sources.unshift({ id:makeId(), title, author:el('source-author').value.trim(), year, type:el('source-type').value, url, note:el('source-note').value.trim() });
  save(); el('source-form').reset(); render(); toast('Source added to your library.');
});
el('add-section').addEventListener('click', () => { const project = current(); if (!project) return; project.outline.push({ id:makeId(), title:'Untitled section', body:'' }); save(); render(); const inputs = el('outline-list').querySelectorAll('input'); inputs[inputs.length - 1]?.focus(); });
el('task-form').addEventListener('submit', event => { event.preventDefault(); const project = current(), title = el('task-title').value.trim(); if (!project || !title) return; project.tasks.push({ id:makeId(), title, done:false }); el('task-title').value = ''; save(); render(); el('task-title').focus(); });

function download(content, type, name) { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function md(value) { return String(value || '').replaceAll('\\', '\\\\').replaceAll('*', '\\*').replaceAll('_', '\\_').replaceAll('[', '\\[').replaceAll(']', '\\]'); }
el('export-markdown').addEventListener('click', () => {
  const project = current(); if (!project) return;
  const lines = [`# ${md(project.title)}`, '', `> ${md(project.question)}`, '', `**Field:** ${md(project.field || 'Not set')}  `, `**Stage:** ${md(project.stage)}  `, `**Target date:** ${project.deadline || 'Not set'}`, '', '## Working thesis / notes', '', project.summary || '_No notes yet._', '', '## Outline', ''];
  project.outline.forEach((section, index) => lines.push(`### ${index + 1}. ${md(section.title || 'Untitled section')}`, '', section.body || '_Add notes here._', ''));
  lines.push('## Sources', ''); project.sources.forEach(source => lines.push(`- ${md(source.title)}${source.author ? ` — ${md(source.author)}` : ''}${source.year ? ` (${source.year})` : ''}${source.url ? ` — ${source.url}` : ''}${source.note ? `\n  - Note: ${md(source.note)}` : ''}`));
  lines.push('', '## Tasks', ''); project.tasks.forEach(task => lines.push(`- [${task.done ? 'x' : ' '}] ${md(task.title)}`));
  download(lines.join('\n'), 'text/markdown', `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'research-project'}.md`); toast('Markdown outline downloaded.');
});
el('backup-button').addEventListener('click', () => { download(JSON.stringify({ app:'ThesisBoard', version:1, exportedAt:new Date().toISOString(), projects }, null, 2), 'application/json', 'thesisboard-backup.json'); toast('Backup downloaded.'); });
el('restore-button').addEventListener('click', () => el('restore-input').click());
el('restore-input').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try { if (file.size > 5_000_000) throw new Error('Backup exceeds the 5 MB limit.'); const data = JSON.parse(await file.text());
    if (data.app !== 'ThesisBoard' || data.version !== 1 || !Array.isArray(data.projects) || !data.projects.every(p => p && typeof p.title === 'string' && typeof p.question === 'string')) throw new Error('This is not a valid ThesisBoard backup.');
    const incoming = data.projects.map(sanitizeProject); const ids = new Set(projects.map(p => p.id)); let added = 0;
    incoming.forEach(project => { if (!ids.has(project.id)) { projects.push(project); ids.add(project.id); added++; } });
    if (!activeId && projects.length) activeId = projects[0].id; save(); render(); toast(`${added} new project${added === 1 ? '' : 's'} imported.`);
  } catch (error) { toast(error.message || 'Could not import the backup.'); }
  event.target.value = '';
});
el('mobile-menu').addEventListener('click', () => el('sidebar').classList.toggle('open'));
document.addEventListener('keydown', event => { if (event.key === 'Escape') el('sidebar').classList.remove('open'); });
render();
