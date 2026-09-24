import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    createdBy: {
        type: String,
        trim:true,
        default:'',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    dueDate: {
        type: Date
    },
    completed: {
        type: Boolean,
        default: false,
    },
    completedAt: {
        type: Date,
        default: null,
    },
},
{
    timestamps: true,    
},
);

const Task = mongoose.model('Task', taskSchema);

export default Task;