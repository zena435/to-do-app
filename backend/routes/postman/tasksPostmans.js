import express from 'express';

const router = express.Router();

const tempTasks = [];
let nextTaskId = 1;

function createTaskId() { //Temporary fxn before mongodb starts
    const taskId = nextTaskId.toString();
    nextTaskId +=1;

    return taskId;
}

function findtask(taskId) {
    for (const task of tempTasks){
        if (task._id === taskId) return task;
            
    }
    return null;
}

function deleteTask(taskId) {
    for(let index = 0; index < tempTasks.length; index++) {
        const task = tempTasks[index]

        if(task._id === taskId) {
            tempTasks.splice(index,1);
             return task;
        }
    }
    return null;
}

//Get all tasks API route
router.get('/', function(req,res){
    res.json(tempTasks);
});

//create a new task API route
router.post('/', function (req,res){
    let taskTitle = '';
    let taskDescription = '';

    const {title, description, dueDate } = req.body;// object destructuring getting all variables from the body

    if(typeof title === 'string') { // validation process
        taskTitle = title.trim();
    }

     if(typeof description === 'string') {// validation process
        taskDescription = description.trim();
    }

    if(!taskTitle) {// validation process
        return res.status(400).json({message: 'Task title is required'});
    }

    const newTask = {
        _id: createTaskId(),
        title: taskTitle,
        description: taskDescription,
        dueDate: null,
        completed: false,
        completedAt: null,
        user: 'test-user',
        createdBy: 'postman test',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    if(dueDate) {
        const selectedDueDate = new Date(dueDate);
        const dueDateIsInvalid = Number.isNaN(selectedDueDate.getTime());

        if(dueDateIsInvalid === true) {
            return res.status(400).json({message:'Due date is invalid'})
        }
        newTask.dueDate = selectedDueDate
    }

    tempTasks.push(newTask);

    res.status(201).json(newTask);


});

//Delete a new task API route
router.delete('/:id', function (req,res){
    const taskId = req.params.id;
    const isValidId = Boolean(taskId);

    if(isValidId === false) {
        return res.status(400).json ({message:'Task id is invalid'})
    }

    const task = deleteTask(taskId);

    if(!task) {
        return res.status(404).json({message: 'Task not found'});
    }

    res.json({message:'Task deleted successfully', task: task});
});

//Make task Complete API route

router.patch('/complete/:id', function (req,res){
    const taskId = req.params.id;
    const isValidId = Boolean(taskId);

    if (isValidId === false) {
        return res.status(400).json({message:'Task id is invalid'});
    }

    const task = findtask(taskId);

    if (!task) {
        return res.status(404).json({message:'Task not found'});
    }

    task.completed = true;
    task.updatedAt = new Date();
    task.completedAt = new Date();

    res.json({ message: 'Task completed',task: task});
});

//Make task incomplete API route

router.patch('/incomplete/:id', function (req,res){
    const taskId = req.params.id;
    const isValidId = Boolean(taskId);

    if (isValidId === false) {
        return res.status(400).json({message:'Task id is invalid'});
    }

    const task = findtask(taskId);

    if (!task) {
        return res.status(404).json({message:'Task not found'});
    }

    task.completed = false;
    task.updatedAt = new Date();
    task.completedAt = null;

    res.json({ message: 'Task set to incomplete',task: task});
});

// Make an edit to a task API route
router.patch('/:id', function (req,res) {
    const taskId = req.params.id;
    const isValidId = Boolean(taskId);
    const {title, description, dueDate} = req.body;

    let taskTitle = '';
    let taskDescription = '';

    if(typeof title === 'string') {
        taskTitle = title.trim();
    }

    if (typeof description === 'string') {
        taskDescription = description.trim();
    }

    if (isValidId === false) {
        return res.status(400).json({ message: 'Task id is invalid'});
    }

    if(!taskTitle) {
        return res.status(400).json ({ message: 'Task title is required'});
    }

    let taskDueDate = null;

    if (dueDate) {
        const selectedDueDate = new Date(dueDate);
        const dueDateIsInvalid = Number.isNaN(selectedDueDate.getTime());

        if (dueDateIsInvalid === true) {
            return res.status(400).json({ message: 'Due date is invalid'});

        }
        
        taskDueDate = selectedDueDate
    }

    const task = findtask(taskId);

    if (!task) {
        return res.status(404).json({ message:'Task not found'});
    }
    
 task.title = taskTitle;
 task.description = taskDescription;
 task.dueDate = taskDueDate;
 task.updatedAt = new Date();
 
 res.json(task);

});

export default router;

