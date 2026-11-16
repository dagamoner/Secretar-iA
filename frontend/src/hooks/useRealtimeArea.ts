"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WSEvent } from "@/types";

interface UseRealtimeAreaReturn {
  isConnected: boolean;
  highlightedDocIds: Set<number>;
  activeEditors: Record<number, string>; // docId -> editor name
  lastEvent: WSEvent | null;
  sendWSMessage: (msg: object) => void;
}

export function useRealtimeArea(areaId: number): UseRealtimeAreaReturn {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [highlightedDocIds, setHighlightedDocIds] = useState<Set<number>>(new Set());
  const [activeEditors, setActiveEditors] = useState<Record<number, string>>({});
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerRowHighlight = useCallback((docId: number) => {
    setHighlightedDocIds((prev) => {
      const next = new Set(prev);
      next.add(docId);
      return next;
    });

    // Remove highlight after exactly 3000 milliseconds
    setTimeout(() => {
      setHighlightedDocIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    if (!areaId) return;

    const baseWS = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const wsUrl = `${baseWS}/ws/${areaId}`;

    function connect() {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log(`[WS] Conectado a canal de área ${areaId}`);
        };

        ws.onmessage = (event) => {
          try {
            const data: WSEvent = JSON.parse(event.data);
            setLastEvent(data);

            if (data.event === "DOC_CREATED" || data.event === "DOC_UPDATED" || data.event === "MOVIMIENTO_ADDED") {
              // Invalidate TanStack query cache to instantly reflect changes without page reload
              queryClient.invalidateQueries({ queryKey: ["documentos", areaId] });
              if (data.doc_id) {
                queryClient.invalidateQueries({ queryKey: ["documento", data.doc_id] });
                queryClient.invalidateQueries({ queryKey: ["movimientos", data.doc_id] });
                // Resalta visualmente durante 3 segundos la fila modificada
                triggerRowHighlight(data.doc_id);
              }
            } else if (data.event === "USER_EDITING") {
              if (data.doc_id) {
                const isEditing = data.payload?.is_editing ?? true;
                setActiveEditors((prev) => {
                  const updated = { ...prev };
                  if (isEditing && data.user_name) {
                    updated[data.doc_id!] = data.user_name;
                  } else {
                    delete updated[data.doc_id!];
                  }
                  return updated;
                });
              }
            }
          } catch (err) {
            console.error("[WS] Error parseando mensaje:", err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          // In Cloud / Vercel mode without local WS daemon, fallback to auto-polling every 4 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 6000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimeoutRef.current = setTimeout(connect, 6000);
      }
    }

    // Auto-polling fallback for Vercel Serverless environment
    const pollInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        queryClient.invalidateQueries({ queryKey: ["documentos", areaId] });
      }
    }, 4000);

    connect();

    return () => {
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [areaId, queryClient, triggerRowHighlight]);

  const sendWSMessage = useCallback((msg: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return {
    isConnected,
    highlightedDocIds,
    activeEditors,
    lastEvent,
    sendWSMessage,
  };
}
