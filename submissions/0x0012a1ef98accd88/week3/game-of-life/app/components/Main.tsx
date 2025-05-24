'use client';

import { FC, useState, useRef, useCallback, useEffect } from "react";
import { Pause, Play, XCircle, Globe } from "react-feather";
import useInterval from "./useInterval"
import { getRandomNumber } from "../contracts/contracts";

const numRows = 5;
const numCols = 5;

// Directions: N, S, E, W, NE, NW, SE, SW
const operations = [
    [0, 1], // right
    [0, -1], // left
    [1, -1], // top left
    [-1, 1], // top right
    [1, 1], // top
    [-1, -1], // bottom
    [1, 0], // bottom right
    [-1, 0], // bottom left
];

const generateEmptyGrid = (): number[][] => {
    const rows = Array(numRows).fill(0).map(() => Array(numCols).fill(0));
    return rows;
};

const randomTiles = async (): Promise<number[][]> => {
    const rows = [];
    for (let i = 0; i < numRows; i++) {
        const row = [];
        for (let j = 0; j < numCols; j++) {
            const randomValue = await getRandomNumber();
            console.log({ randomValue });

            row.push(randomValue > 0.5 ? 1 : 0);
        }
        rows.push(row);
    }
    return rows;
};

const Main: FC = () => {
    const [grid, setGrid] = useState(generateEmptyGrid);
    const [running, setRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const runningRef = useRef(running);
    runningRef.current = running;

    useEffect(() => {
        const initializeGrid = async () => {
            setIsLoading(true);
            const newGrid = await randomTiles();
            setGrid(newGrid);
            setIsLoading(false);
        };
        initializeGrid();
    }, []);

    const runSimulation = useCallback((grid: any) => {
        if (!runningRef.current) {
            return;
        }

        let gridCopy = JSON.parse(JSON.stringify(grid));
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                let neighbors = 0;

                operations.forEach(([x, y]) => {
                    const newI = i + x;
                    const newJ = j + y;

                    if (newI >= 0 && newI < numRows && newJ >= 0 && newJ < numCols) {
                        neighbors += grid[newI][newJ];
                    }
                });

                if (neighbors < 2 || neighbors > 3) {
                    gridCopy[i][j] = 0;
                } else if (grid[i][j] === 0 && neighbors === 3) {
                    gridCopy[i][j] = 1;
                }
            }
        }

        setGrid(gridCopy);
    }, []);

    useInterval(() => {
        runSimulation(grid);
    }, 150);

    const exists = (grid: any) => {
        return grid.some((row: any) => row.includes(1));
    }

    return (
        <div className="container text-center py-5">
            <h1 className="mb-8 text-3xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Game of Life</h1>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
                    width: "fit-content",
                    margin: "0 auto",
                }}
            >
                {grid.map((rows, i) =>
                    rows.map((col, k) => (
                        <div
                            key={`${i}-${k}`}
                            onClick={() => {
                                // Deep clone grid
                                let newGrid = JSON.parse(JSON.stringify(grid));
                                newGrid[i][k] = grid[i][k] ? 0 : 1;
                                setGrid(newGrid);
                            }}
                            style={{
                                width: 30,
                                height: 30,
                                backgroundColor: grid[i][k] ? "#DC143C" : '',
                                border: "1px solid #595959",
                            }}
                        ></div>
                    ))
                )}
            </div>

            <div className="buttons m-3 p-5">
                {isLoading && (
                    <div className="mb-4">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                        </div>
                    </div>
                )}
                <button
                    type="button"
                    className={`inline-flex item-center text-white ${running ? 'bg-orange-700 hover:bg-orange-800 focus:ring-orange-300 dark:bg-orange-600 dark:hover:bg-orange-700 dark:focus:ring-orange-800' : 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'}  focus:outline-none focus:ring-4  font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 disabled:opacity-50`}
                    onClick={() => {
                        setRunning(!running);
                        if (!running) {
                            runningRef.current = true;
                        }
                    }}
                    disabled={!exists(grid) || isLoading}
                >
                    <span className="icon">{running ? <Pause /> : <Play />}</span>
                    <span className="mx-1">{running ? "Pause" : "Start"}</span>
                </button>

                <button
                    type="button"
                    className={`inline-flex item-center text-white bg-red-700 hover:bg-red-800 focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 focus:outline-none focus:ring-4  font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2`}
                    onClick={async () => {
                        setIsLoading(true);
                        setRunning(false);
                        runningRef.current = false;
                        const newGrid = await randomTiles();
                        setGrid(newGrid);
                        setIsLoading(false);
                    }}
                    disabled={isLoading}
                >
                    <span className="icon">
                        <Globe />
                    </span>
                    <span className="mx-1">Random</span>
                </button>

                <button
                    type="button"
                    className={`inline-flex item-center text-white bg-cyan-700 hover:bg-cyan-800 focus:ring-cyan-300 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-800 focus:outline-none focus:ring-4  font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2`}
                    onClick={() => {
                        setRunning(false);
                        runningRef.current = false;
                        setGrid(generateEmptyGrid);
                    }}
                >
                    <span className="icon">
                        <XCircle />
                    </span>
                    <span className="mx-1">Clear</span>
                </button>
            </div>
        </div>
    );
};

export default Main