import React from 'react'

export default function Info() {
    return (
        <div className="container align-left mx-auto max-w-md">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                How does it work
            </h2>
            <p className="mb-3 text-gray-500 dark:text-gray-400">
                Every cell interacts with its eight neighbours, which are the cells that are horizontally, vertically, or diagonally adjacent.
            </p>
            <h2 className="my-4 text-lg font-semibold text-gray-900 dark:text-white">
                Rules that govern the game
            </h2>

            <ul className="space-y-4 text-gray-500 dark:text-gray-400">
                <li className="flex items-center">
                    <svg className="mr-10 w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>Any live cell with fewer than two live neighbours dies, as if by underpopulation.</li>
                <li className="flex items-center">
                    <svg className="mr-10 w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>Any live cell with two or three live neighbours lives on to the next generation.</li>
                <li className="flex items-center">
                    <svg className="mr-10 w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>Any live cell with more than three live neighbours dies, as if by overpopulation.</li>
                <li className="flex items-center">
                    <svg className="mr-10 w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.</li>
            </ul>
        </div>
    )
}
