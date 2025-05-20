// get_canvas_grid.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed

pub struct CanvasCell {
    pub let x: Int
    pub let y: Int
    pub let isClaimed: Bool
    
    init(x: Int, y: Int, isClaimed: Bool) {
        self.x = x
        self.y = y
        self.isClaimed = isClaimed
    }
}

pub fun main(): [CanvasCell] {
    let cells: [CanvasCell] = []
    
    // Loop through the entire canvas grid
    for y in 0..<FlowCanvas.canvasHeight {
        for x in 0..<FlowCanvas.canvasWidth {
            // Check if this position is claimed
            let isClaimed = FlowCanvas.isPositionClaimed(x: x, y: y)
            
            // Add the cell to the result
            cells.append(CanvasCell(x: x, y: y, isClaimed: isClaimed))
        }
    }
    
    return cells
}