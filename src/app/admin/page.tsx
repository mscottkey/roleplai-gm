
'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, orderBy, query, onSnapshot } from 'firebase/firestore';
import type { GameSession } from '@/app/lib/types';
import { GameInspector } from '@/components/admin/game-inspector';
import { BrandedLoadingSpinner } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Users, Coins, History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { AiUsageLog } from '../actions/admin-actions';
import { calculateCost } from '@/lib/ai-costs';

export default function AdminDashboardPage() {
    const [games, setGames] = useState<GameSession[]>([]);
    const [usageLogs, setUsageLogs] = useState<AiUsageLog[]>([]);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [selectedGame, setSelectedGame] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getFirestore();

        getDocs(collection(db, 'users')).then(snap => setTotalUsers(snap.size));

        const gamesQuery = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
        const gamesUnsub = onSnapshot(gamesQuery, (snapshot) => {
            const allGames = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as GameSession));
            setGames(allGames);
            setLoading(false);
        });

        const usageQuery = query(collection(db, 'aiUsageLogs'), orderBy('createdAt', 'desc'));
        const usageUnsub = onSnapshot(usageQuery, (snapshot) => {
            const allLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as AiUsageLog));
            setUsageLogs(allLogs);
        });

        return () => {
            gamesUnsub();
            usageUnsub();
        };
    }, []);
    
    const totalCost = usageLogs.reduce((acc, log) => acc + log.cost, 0);
    const totalTokens = usageLogs.reduce((acc, log) => acc + log.usage.totalTokens, 0);


    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <BrandedLoadingSpinner className="w-24 h-24" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-muted/40">
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-background border-b p-4">
                    <h1 className="text-2xl font-headline font-bold text-primary">Admin Dashboard</h1>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total AI Cost</CardTitle>
                            <Coins className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
                            <p className="text-xs text-muted-foreground">{totalTokens.toLocaleString()} total tokens</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{games.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Registered Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalUsers}</div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total AI Calls</CardTitle>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{usageLogs.length}</div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="flex-1 overflow-auto p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <Card className="col-span-1 xl:col-span-2 flex flex-col">
                        <CardHeader>
                            <CardTitle>Live AI Usage Logs</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                             <div className="h-full overflow-auto">
                               <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>Flow Type</TableHead>
                                        <TableHead>Game ID</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead>Tokens</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usageLogs.slice(0, 100).map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs">{log.createdAt ? formatDistanceToNow(log.createdAt.toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                                            <TableCell><Badge variant="secondary" className="font-mono text-xs">{log.flowType}</Badge></TableCell>
                                            <TableCell className="font-mono text-xs truncate">{log.gameId || 'N/A'}</TableCell>
                                            <TableCell className="font-mono text-xs">{log.model.replace('googleai/','').replace('gemini-','')}</TableCell>
                                            <TableCell className="text-xs">{log.usage.totalTokens.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">${log.cost.toFixed(5)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                               </Table>
                            </div>
                        </CardContent>
                    </Card>
                     <Card className="col-span-1 flex flex-col">
                        <CardHeader>
                            <CardTitle>Game Inspector</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                           <div className="h-full overflow-auto">
                               <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Game Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {games.map(game => (
                                        <TableRow 
                                            key={game.id} 
                                            onClick={() => setSelectedGame(game)}
                                            className="cursor-pointer"
                                            data-state={selectedGame?.id === game.id ? 'selected' : ''}
                                        >
                                            <TableCell className="font-medium text-sm">{game.gameData.name}</TableCell>
                                            <TableCell><Badge variant={game.step === 'play' ? 'default' : 'secondary'}>{game.step}</Badge></TableCell>
                                            <TableCell className="text-xs">{game.createdAt ? formatDistanceToNow(game.createdAt.toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                               </Table>
                           </div>
                           <div className="mt-4">
                            {selectedGame ? (
                                    <GameInspector game={selectedGame} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 border rounded-lg border-dashed">
                                        <p>Select a game to inspect its data.</p>
                                    </div>
                                )}
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
