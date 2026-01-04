import React, { useState, useEffect, useRef } from 'react';
import {
  X, Check, Save, Plus, Search, Pin, ChevronLeft, Edit3, Eye, Trash2, Clock, Hash, Tag
} from 'lucide-react';
import { Note } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface NotesProps {  isDarkMode: boolean;
  notes: Note[];
  onAddNote: (note: Note) => Promise<Note>;
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const COLORS = [
  { id: 'gray', bg: 'bg-zinc-100', darkBg: 'bg-zinc-800', border: 'border-zinc-300' },
  { id: 'blue', bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', border: 'border-blue-500/30' },
  { id: 'green', bg: 'bg-emerald-50', darkBg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  { id: 'purple', bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', border: 'border-purple-500/30' },
  { id: 'rose', bg: 'bg-rose-50', darkBg: 'bg-rose-900/20', border: 'border-rose-500/30' },
  { id: 'yellow', bg: 'bg-amber-50', darkBg: 'bg-amber-900/20', border: 'border-amber-500/30' },
];

const Notes: React.FC<NotesProps> = ({ isDarkMode, notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('gray');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Unsaved' | 'Saving'>('Saved');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      loadNote(notes[0]);
    } else if (notes.length === 0 && !activeNoteId) {
      createNewNote();
    }
  }, [notes.length]);

  const loadNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || []);
    setSelectedColor(note.color || 'gray');
    setSaveStatus('Saved');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const createNewNote = async () => {
    const newNote: Note = {
      id: '', // Will be set by DB
      title: '',
      content: '',
      tags: [],
      color: 'gray',
      date: new Date().toISOString(),
      isPinned: false
    };
    try {
        const addedNote = await onAddNote(newNote);
        loadNote(addedNote);
        setViewMode('edit');
        setTimeout(() => document.getElementById('note-title-input')?.focus(), 100);
    } catch (e) {
        console.error("Failed to create note");
    }
  };

  // --- SAVING LOGIC ---
  const handleSave = async () => {
    if (!activeNoteId) return;
    setSaveStatus('Saving');
    
    const noteToUpdate = notes.find(n => n.id === activeNoteId);
    if (!noteToUpdate) return;

    const updated: Note = {
        ...noteToUpdate,
        title,
        content,
        tags,
        color: selectedColor as any,
        date: new Date().toISOString()
    };
    
    await onUpdateNote(updated);
    setSaveStatus('Saved');
  };

  // Auto-save debouncer
  useEffect(() => {
    const timer = setTimeout(() => {
        if (activeNoteId && saveStatus === 'Unsaved') {
            handleSave();
        }
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, content, tags, selectedColor, saveStatus]);

  const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
      setter(value);
      setSaveStatus('Unsaved');
  };

  // --- EDITOR TOOLS ---
  const insertFormat = (prefix: string, suffix: string = '') => {
    if (!textAreaRef.current) return;
    const textarea = textAreaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    const isBlock = prefix.startsWith('\n');
    let finalPrefix = prefix;
    if (isBlock && start > 0 && text[start - 1] !== '\n') {
        finalPrefix = '\n' + prefix.trimStart();
    }
    const newContent = before + finalPrefix + selection + suffix + after;
    handleChange(setContent, newContent);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + finalPrefix.length + selection.length + suffix.length;
      if (suffix && !selection) textarea.setSelectionRange(start + finalPrefix.length, start + finalPrefix.length);
      else textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        handleChange(setTags, newTags);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(t => t !== tagToRemove);
    handleChange(setTags, newTags);
  };

  const handleDelete = async () => {
      if (!activeNoteId) return;
      setConfirmModal({
        isOpen: true,
        title: 'Delete Note',
        description: 'Are you sure you want to delete this note? This action cannot be undone.',
        onConfirm: async () => {
          await onDeleteNote(activeNoteId);
          setActiveNoteId(null);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
  };

  const renderPreview = () => {
      if (!content) return <p className="opacity-30 italic">Start typing to see your note...</p>;
      return content.split('\n').map((line, i) => {
          const checkboxMatch = line.match(/^- \[(.)\] (.*)/);
          if (checkboxMatch) {
              const isChecked = checkboxMatch[1].toLowerCase() === 'x';
              const text = checkboxMatch[2];
              return (
                  <div key={i} className="flex items-start gap-3 py-1 group">
                      <div className={`mt-1 w-4 h-4 rounded border cursor-pointer flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : isDarkMode ? 'border-zinc-600 bg-zinc-800 hover:border-indigo-500' : 'border-slate-300 bg-white hover:border-indigo-500'}`}>
                          {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className={`text-base leading-relaxed ${isChecked ? 'line-through opacity-50 decoration-2' : ''}`}>{text}</span>
                  </div>
              );
          }
          if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-6 mb-3">{line.replace('# ', '')}</h1>;
          if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-5 mb-2">{line.replace('## ', '')}</h2>;
          if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.replace('### ', '')}</h3>;
          if (line.startsWith('- ')) return <li key={i} className="ml-5 list-disc pl-1 py-0.5">{line.replace('- ', '')}</li>;
          if (line.startsWith('> ')) return <blockquote key={i} className={`border-l-4 pl-4 py-1 my-2 italic ${isDarkMode ? 'border-zinc-700 text-zinc-400' : 'border-slate-300 text-slate-600'}`}>{line.replace('> ', '')}</blockquote>;
          if (line.startsWith('```')) return null;
          if (!line.trim()) return <div key={i} className="h-4" />;
          return <p key={i} className="mb-1.5 leading-relaxed whitespace-pre-wrap">{line}</p>;
      });
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`w-full h-full flex overflow-hidden ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
      
      {/* Sidebar */}
      <div className={`
        ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 overflow-hidden'} 
        shrink-0 border-r flex flex-col transition-all duration-300 ease-spring relative z-20
        ${isDarkMode ? 'border-[#27272a] bg-[#0c0c0e]' : 'border-slate-200 bg-white'}
      `}>
        <div className="p-5 border-b shrink-0 space-y-4 border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base flex items-center gap-2"><Save size={18} className="text-indigo-500" /> My Notes</h2>
            <button onClick={createNewNote} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-500/20 active:scale-95"><Plus size={18} /></button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredNotes.map(note => (
            <div key={note.id} onClick={() => loadNote(note)} className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${activeNoteId === note.id ? (isDarkMode ? 'bg-zinc-800/80 border-zinc-700 shadow-lg' : 'bg-white border-indigo-200 shadow-md shadow-indigo-100') : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>
              <div className="flex justify-between items-start mb-1.5">
                <h4 className={`font-bold text-sm truncate pr-4 ${!note.title ? 'opacity-40 italic' : ''}`}>{note.title || 'Untitled Note'}</h4>
                {note.isPinned && <Pin size={12} className="text-indigo-500 shrink-0" fill="currentColor" />}
              </div>
              <p className="text-xs opacity-50 line-clamp-2 mb-3 font-medium leading-relaxed">{note.content || 'No additional text'}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {(note.tags || []).slice(0, 2).map(t => (
                        <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>#{t}</span>
                    ))}
                </div>
                <span className="text-[10px] opacity-30 font-mono">{new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className={`h-16 shrink-0 flex items-center justify-between px-6 border-b z-10 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}><ChevronLeft size={20} className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} /></button>
            <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-[#0c0c0e] border-[#27272a]' : 'bg-slate-50 border-slate-200'}`}>
                <button onClick={() => setViewMode('edit')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}><Edit3 size={14} /> Write</button>
                <button onClick={() => setViewMode('preview')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}><Eye size={14} /> Read</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
             <button onClick={handleSave} disabled={saveStatus === 'Saved'} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${saveStatus === 'Unsaved' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 hover:bg-indigo-500' : isDarkMode ? 'bg-zinc-800/50 text-zinc-500 border-transparent cursor-default' : 'bg-slate-100 text-slate-400 border-transparent cursor-default'}`}>
                {saveStatus === 'Saving' ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{saveStatus}</span>
             </button>
             <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-dashed border-zinc-200 dark:border-zinc-800">
                {COLORS.map(c => (
                  <button key={c.id} onClick={() => { setSelectedColor(c.id); handleChange(setSelectedColor, c.id); }} className={`w-3 h-3 rounded-full transition-transform hover:scale-125 ${selectedColor === c.id ? `scale-125 ring-2 ring-offset-2 ${isDarkMode ? 'ring-white ring-offset-[#09090b]' : 'ring-black ring-offset-white'}` : ''} ${c.id === 'gray' ? 'bg-zinc-500' : `bg-${c.id}-500`}`} style={{ backgroundColor: c.id === 'gray' ? '#71717a' : `var(--color-${c.id}-500)` }} />
                ))}
             </div>
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto custom-scrollbar relative`}>
           <div className="max-w-3xl mx-auto py-12 px-8 min-h-full flex flex-col">
              <input id="note-title-input" value={title} onChange={(e) => handleChange(setTitle, e.target.value)} placeholder="Note Title" className={`w-full text-4xl font-black bg-transparent outline-none mb-6 placeholder:opacity-20 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`} />
              <div className="flex flex-wrap items-center gap-2 mb-8">
                 {tags.map(tag => (
                   <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                      <Hash size={10} className="opacity-50" /> {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-rose-500"><X size={10} /></button>
                   </span>
                 ))}
                 <div className="relative group">
                    <Tag size={14} className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-600 group-focus-within:text-indigo-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />
                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Add tag..." className={`pl-8 pr-3 py-1.5 rounded-full text-xs font-medium outline-none border border-transparent transition-all w-32 focus:w-48 ${isDarkMode ? 'bg-zinc-900 focus:bg-zinc-800 focus:border-zinc-700 placeholder-zinc-600' : 'bg-white focus:bg-slate-50 focus:border-slate-200 placeholder-slate-400'}`} />
                 </div>
              </div>
              <div className="flex-1 relative min-h-[400px]">
                  {viewMode === 'edit' ? (
                      <textarea ref={textAreaRef} value={content} onChange={(e) => handleChange(setContent, e.target.value)} placeholder="Start writing..." spellCheck={false} className={`w-full h-full bg-transparent outline-none resize-none text-lg leading-relaxed font-medium font-sans placeholder:opacity-20 ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`} />
                  ) : (
                      <div className={`prose max-w-none ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>{renderPreview()}</div>
                  )}
              </div>
           </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDarkMode={isDarkMode}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Notes;