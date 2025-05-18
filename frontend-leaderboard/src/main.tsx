import './style.css';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { callCadenceScript } from './utils';
import { getLeaderboardScript, getLeaderboardScriptArgs } from './scripts';

type LeaderboardData = {
    rank: number;
    name: string;
    score: number;
}

type LeaderboardDataRawStruct = {
    type: "Struct";
    value: {
        fields: [
            { name: "participant", value: { type: "String", value: string } },
            { name: "score", value: { type: "UFix64", value: string } },
        ],
        id: string;
    }
}

// Simulate async fetch for leaderboard data
async function fetchLeaderboardData(type: 'overall' | 'current'): Promise<Array<LeaderboardData>> {
    let res: { type: "Array"; value: Array<LeaderboardDataRawStruct> } = { type: "Array", value: [] };
    if (type === 'overall') {
        res = await callCadenceScript(getLeaderboardScript, getLeaderboardScriptArgs(undefined));
    } else {
        const now = Date.now()
        const periods = [
            { key: "week1", start: 1746316800.0, end: 1746921600.0 },
            { key: "week2", start: 1746921600.0, end: 1747526400.0 },
            { key: "week3", start: 1747526400.0, end: 1748131200.0 },
            { key: "week4", start: 1748131200.0, end: 1748736000.0 },
        ]
        const currentPeriod = periods.find((p) => now >= p.start && now <= p.end)
        if (currentPeriod) {
            res = await callCadenceScript(getLeaderboardScript, getLeaderboardScriptArgs(currentPeriod.key));
        }
    }
    const returnData: Array<Partial<LeaderboardData>> = [];
    for (const r of res.value) {
        returnData.push({
            name: r.value.fields[0].value.value,
            score: Number.parseFloat(r.value.fields[1].value.value),
        })
    }
    return returnData
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .map((r, i) => ({
            rank: i + 1,
            name: r.name ?? "",
            score: r.score ?? 0,
        }));
}

// Tab component
function Tabs({ tabs, current, onTabChange }: { tabs: string[]; current: string; onTabChange: (tab: string) => void }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {tabs.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    style={{
                        margin: '0 1rem',
                        borderBottom: current === tab ? '2px solid #646cff' : '2px solid transparent',
                        background: 'none',
                        color: 'inherit',
                        fontWeight: current === tab ? 'bold' : 'normal',
                        cursor: 'pointer',
                        fontSize: '1.1em',
                    }}
                    onClick={() => onTabChange(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}

// Leaderboard component
function Leaderboard({ data, loading, error }: { data: Array<LeaderboardData> | null, loading: boolean, error: string | null }) {
    return (
        <table className="leaderboard-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Participant Address</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                {error ? (
                    <tr>
                        <td colSpan={3} style={{ color: 'red' }}>{error}</td>
                    </tr>
                ) : loading ? (
                    <tr>
                        <td colSpan={3}>Loading...</td>
                    </tr>
                ) : data && data.length > 0 ? (
                    data.map((entry) => (
                        <tr key={entry.name}>
                            <td>{entry.rank}</td>
                            <td>{entry.name}</td>
                            <td>{entry.score}</td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={3}>No data</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

function App() {
    const [tab, setTab] = useState<'Overall' | 'Current'>('Overall');
    const [data, setData] = useState<Array<LeaderboardData> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchLeaderboardData(tab.toLowerCase() as 'overall' | 'current').then((d) => {
            setData(d);
            setLoading(false);
        }).catch((e) => {
            setError(e.message);
            setLoading(false);
        });
    }, [tab]);

    return (
        <div>
            <h1>Leaderboard</h1>
            <Tabs tabs={['Overall', 'Current']} current={tab} onTabChange={(t) => setTab(t as 'Overall' | 'Current')} />
            <Leaderboard data={data} loading={loading} error={error} />
        </div>
    );
}

const app = document.getElementById('app');
if (app) {
    render(<App />, app);
}
