import { Droppable } from '@hello-pangea/dnd'
import { Plus } from 'lucide-react'
import JobCard from './JobCard'
import { STATUS_CONFIG } from '../../utils/constants'

export default function KanbanColumn({ status, jobs, onAddJob, onEditJob, onDeleteJob }) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex flex-col min-w-[260px] max-w-[280px] flex-shrink-0">
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg ${config.lightColor} border-t border-x ${config.borderColor}/30`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className={`text-sm font-semibold ${config.textColor}`}>{config.label}</span>
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${config.lightColor} ${config.textColor}`}>
            {jobs.length}
          </span>
        </div>
        {status === 'saved' && (
          <button
            onClick={onAddJob}
            className={`${config.textColor} opacity-70 hover:opacity-100 transition-opacity`}
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex flex-col gap-2 p-2 rounded-b-lg min-h-[400px] flex-1
              border border-t-0 transition-colors
              ${snapshot.isDraggingOver
                ? `${config.lightColor} ${config.borderColor}/50`
                : 'border-slate-700/50 bg-slate-800/30'
              }
            `}
          >
            {jobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                index={index}
                onEdit={onEditJob}
                onDelete={onDeleteJob}
              />
            ))}
            {provided.placeholder}
            {jobs.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-slate-600 text-xs text-center">
                  {status === 'saved' ? 'Add your first job' : 'Drag cards here'}
                </p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
