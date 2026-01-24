import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

// Default WebSocket URL (can be overridden by environment variable)
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws-baseball';

interface SocketContextType {
    client: Client | null;
    connected: boolean;
    publish: (destination: string, body: any) => void;
    subscribe: (destination: string, callback: (message: any) => void) => StompSubscription | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const client = new Client({
            brokerURL: WS_URL,
            reconnectDelay: 5000, // Try to reconnect every 5s
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('STOMP Connected');
                setConnected(true);
            },
            onDisconnect: () => {
                console.log('STOMP Disconnected');
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    const publish = (destination: string, body: any) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body),
            });
        } else {
            console.warn('Cannot publish, STOMP not connected');
        }
    };

    const subscribe = (destination: string, callback: (message: any) => void) => {
        if (clientRef.current && clientRef.current.connected) {
            return clientRef.current.subscribe(destination, (message: IMessage) => {
                try {
                    const parsedBody = JSON.parse(message.body);
                    callback(parsedBody);
                } catch (e) {
                    console.error('Failed to parse message body', e);
                    callback(message.body); // Fallback to raw string
                }
            });
        }
        console.warn('Cannot subscribe, STOMP not connected');
        return null;
    };

    return (
        <SocketContext.Provider value={{ client: clientRef.current, connected, publish, subscribe }}>
            {children}
        </SocketContext.Provider>
    );
};
