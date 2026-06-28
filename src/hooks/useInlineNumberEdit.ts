"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseInlineNumberEditOptions {
  value: number;
  onCommit?: (value: number) => void;
  min?: number;
  max?: number;
}

export function useInlineNumberEdit({
  value,
  onCommit,
  min = -99,
  max = 999,
}: UseInlineNumberEditOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setEditValue(String(value)), [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const cancel = useCallback(() => {
    setEditValue(String(value));
    setIsEditing(false);
  }, [value]);

  const commit = useCallback(() => {
    setIsEditing(false);
    if (!onCommit) return;
    let num = parseInt(editValue, 10) || 0;
    num = Math.max(min, Math.min(max, num));
    if (num !== value) onCommit(num);
    setEditValue(String(num));
  }, [editValue, onCommit, value, min, max]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  return {
    isEditing,
    editValue,
    setEditValue,
    inputRef,
    startEditing,
    commit,
    cancel,
  };
}
