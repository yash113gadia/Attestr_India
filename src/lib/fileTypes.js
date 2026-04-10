// Centralized file type detection and metadata for Attestr
import { FileText, Music, Film, Image, FileDigit, Box, Code, Table, Camera, Archive, FileCheck } from 'lucide-react';

export function getFileCategory(file) {
  if (!file) return 'unknown';
  const mime = file.type || '';
  const ext = file.name?.split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'cr2', 'nef', 'arw', 'dng'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) return 'audio';
  if (mime.includes('pdf') || ext === 'pdf') return 'document';
  if (['doc', 'docx', 'odt', 'rtf', 'txt', 'md'].includes(ext)) return 'document';
  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) return 'data';
  if (['glb', 'obj', 'stl', 'fbx', 'gltf'].includes(ext)) return '3d';
  if (['js', 'py', 'sol', 'cpp', 'c', 'java', 'ts', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'rs', 'go'].includes(ext)) return 'code';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'archive';
  return 'other';
}

export const FILE_CATEGORIES = {
  image:    { label: 'Image',    icon: Image,     color: 'text-accent',    tag: 'IMG',  hasELA: true,  hasEXIF: true,  hasPerceptual: true },
  video:    { label: 'Video',    icon: Film,      color: 'text-kesari',    tag: 'VID',  hasELA: false, hasEXIF: false, hasPerceptual: false },
  audio:    { label: 'Audio',    icon: Music,     color: 'text-violet-400',tag: 'AUD',  hasELA: false, hasEXIF: false, hasPerceptual: false },
  document: { label: 'Document', icon: FileText,  color: 'text-blue-400',  tag: 'DOC',  hasELA: false, hasEXIF: false, hasPerceptual: false },
  data:     { label: 'Data',     icon: Table,     color: 'text-emerald',   tag: 'DATA', hasELA: false, hasEXIF: false, hasPerceptual: false },
  '3d':     { label: '3D Model', icon: Box,       color: 'text-pink-400',  tag: '3D',   hasELA: false, hasEXIF: false, hasPerceptual: false },
  code:     { label: 'Code',     icon: Code,      color: 'text-green-400', tag: 'CODE', hasELA: false, hasEXIF: false, hasPerceptual: false },
  archive:  { label: 'Archive',  icon: Archive,   color: 'text-amber-400', tag: 'ZIP',  hasELA: false, hasEXIF: false, hasPerceptual: false },
  other:    { label: 'File',     icon: FileCheck,  color: 'text-ink-secondary', tag: 'FILE', hasELA: false, hasEXIF: false, hasPerceptual: false },
  unknown:  { label: 'File',     icon: FileCheck,  color: 'text-ink-secondary', tag: 'FILE', hasELA: false, hasEXIF: false, hasPerceptual: false },
};

export function getFileMeta(file) {
  const category = getFileCategory(file);
  return FILE_CATEGORIES[category] || FILE_CATEGORIES.unknown;
}

export function getIntegrityFeatures(category) {
  const meta = FILE_CATEGORIES[category] || FILE_CATEGORIES.unknown;
  const features = [
    { key: 'sha256', label: 'SHA-256 Hash', desc: 'Exact byte-level fingerprint', always: true },
  ];
  if (meta.hasPerceptual) {
    features.push({ key: 'dhash', label: 'Perceptual Hash', desc: 'Survives compression & screenshots' });
  }
  if (meta.hasELA) {
    features.push({ key: 'ela', label: 'Error Level Analysis', desc: 'Detects compression inconsistencies from edits' });
  }
  if (meta.hasEXIF) {
    features.push({ key: 'exif', label: 'Metadata Forensics', desc: 'Camera data, GPS, timestamps, edit history' });
  }
  if (!meta.hasELA && !meta.hasEXIF) {
    features.push({ key: 'integrity', label: 'Byte Integrity', desc: 'Any change, even a single bit, will be detected' });
  }
  return features;
}
