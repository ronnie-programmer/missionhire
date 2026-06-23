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
