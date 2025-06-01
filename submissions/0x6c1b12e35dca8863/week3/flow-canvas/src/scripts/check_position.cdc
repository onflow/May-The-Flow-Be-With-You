// check_position.cdc
import FlowCanvas from 0x01 // Replace with your actual contract address when deployed

pub fun main(x: Int, y: Int): Bool {
    return FlowCanvas.isPositionClaimed(x: x, y: y)
}