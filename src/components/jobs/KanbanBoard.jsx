// src/components/jobs/KanbanBoard.jsx
//
// Top-level drag-and-drop Kanban board. Manages the DragDropContext and groups
// jobs into columns by status.
//
// @hello-pangea/dnd is a maintained fork of react-beautiful-dnd.
// The library requires three components working together:
//   DragDropContext — wraps the entire drag area and provides the onDragEnd callback
//   Droppable      — marks a drop zone (each column), rendered in KanbanColumn
//   Draggable      — marks a draggable item (each card), rendered in JobCard
//
// handleDragEnd is called when the user releases a dragged card:
//   - `result.destination` is null if the card was dropped outside any column → ignore
//   - If dropped back in the same column at the same index → nothing changed, ignore
//   - Otherwise, call onStatusChange(cardId, newColumnStatus) to trigger the
//     optimistic update + DB write in useJobs
//
// jobsByStatus is a dictionary mapping each status string to its array of jobs,
// computed fresh on every render. This is derived state — no need to store it
// separately in useState since it's always computable from the `jobs` prop.
//
// The STATUSES array from constants.js defines the column order. Iterating over it
// guarantees columns always appear in the correct sequence.

import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import { STATUSES } from '../../utils/constants'

export default function KanbanBoard({ jobs, onAddJob, onEditJob, onDeleteJob, onStatusChange }) {
  function handleDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    onStatusChange(draggableId, destination.droppableId)
  }

  const jobsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = jobs.filter(j => j.status === status)
    return acc
  }, {})

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            jobs={jobsByStatus[status]}
            onAddJob={onAddJob}
            onEditJob={onEditJob}
            onDeleteJob={onDeleteJob}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
