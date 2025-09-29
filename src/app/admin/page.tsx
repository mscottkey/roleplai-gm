
'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, orderBy, query, onSnapshot } from 'firebase/firestore';
import type { GameSession } from '@/app/lib/types';
import { GameInspector } from '@/components/admin/game-inspector';
import { BrandedLoadingSpinner } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
    const [games, setGames] = useState<GameSession[]>([]);
    const [totalUsers, setTotalUsers] = useState<number>(0);
    const [selectedGame, setSelectedGame] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const db = getFirestore();

        // Fetch total users (a bit of a hack without a dedicated counter)
        // In a real app, use a Cloud Function to maintain a counter.
        getDocs(collection(db, 'users')).then(snap => {
            setTotalUsers(snap.size);
        });

        const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allGames = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as GameSession));
            setGames(allGames);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                </div>
                
                <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="col-span-1 flex flex-col">
                        <CardHeader>
                            <CardTitle>All Game Sessions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden">
                            <div className="h-full overflow-auto">
                               <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Game Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>User ID</TableHead>
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
                                            <TableCell className="font-medium">{game.gameData.name}</TableCell>
                                            <TableCell><Badge variant={game.step === 'play' ? 'default' : 'secondary'}>{game.step}</Badge></TableCell>
                                            <TableCell>{game.createdAt ? formatDistanceToNow(game.createdAt.toDate(), { addSuffix: true }) : 'N/A'}</TableCell>
                                            <TableCell className="font-mono text-xs truncate">{game.userId}</TableCell>
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
                               {selectedGame ? (
                                <GameInspector game={selectedGame} />
                               ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
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
