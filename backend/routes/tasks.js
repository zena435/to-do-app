import express from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth); // Middleware - Students must be logged in before using the task dashboard

// Gets all tasks from MongoDB
router.get('/', async function (req, res) {
  try {
    const tasks = await Task.find({}).sort({ createdAt: -1 });

    res.json(tasks);

  } catch (error) {
    console.log('Failed to get tasks:', error);
    res.status(500).json({ message: 'Failed to get tasks' });
  }
});

// Creates a new task
router.post('/', async function (req, res) {
  try {
    let taskTitle = '';
    let taskDescription = '';
    
    const { title, description, dueDate } = req.body; // object destructuring

    if (typeof title === 'string') {
      taskTitle = title.trim();
    }

    if (typeof description === 'string') {
      taskDescription = description.trim();
    }

    if (!taskTitle) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const newTask = {
      title: taskTitle,
      user: req.userId,
      createdBy: req.userName,
    };

    if (taskDescription) {
      newTask.description = taskDescription;
    }

    if (dueDate) {
      const selectedDueDate = new Date(dueDate);
      const dueDateIsInvalid = Number.isNaN(selectedDueDate.getTime());

      if (dueDateIsInvalid === true) {
        return res.status(400).json({ message: 'Due date is invalid.' });
      }

      newTask.dueDate = selectedDueDate;
    }

    const task = await Task.create(newTask);

    res.status(201).json(task);

  } catch (error) {
    console.log('Failed to create task:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// Sets a task to complete
router.patch('/complete/:id', async function (req, res) {
  try {
    const taskId = req.params.id;
    // MongoDB task ids must be in a special format.
    // This checks if the id from the URL looks like a real MongoDB id.
    const isValidId = mongoose.Types.ObjectId.isValid(taskId);

    if (isValidId === false) {
      return res.status(400).json({ message: 'Task id is invalid.' });
    }

    // Find this task only if it belongs to the logged-in user.
    const task = await Task.findOne({ _id: taskId, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = true;
    task.completedAt = new Date();

    await task.save();

    res.json({ message: 'Task completed', task: task });

  } catch (error) {
    console.log('Failed to complete the task:', error);
    res.status(500).json({ message: 'Failed to complete the task' });
  }
});

// Sets a task to incomplete
router.patch('/incomplete/:id', async function (req, res) {
  try {
    const taskId = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(taskId);

    if (isValidId === false) {
      return res.status(400).json({ message: 'Task id is invalid.' });
    }

    // Find this task only if it belongs to the logged-in user.
    const task = await Task.findOne({ _id: taskId, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.completed = false;
    task.completedAt = null;

    await task.save();

    res.json({ message: 'Task set to incomplete', task: task });

  } catch (error) {
    console.log('Failed to set the task to incomplete:', error);
    res.status(500).json({ message: 'Failed to set the task to incomplete' });
  }
});

// Updates the editable details of a task.
router.patch('/:id', async function (req, res) {
  try {
    const taskId = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(taskId);
    const { title, description, dueDate } = req.body;
    let taskTitle = '';
    let taskDescription = '';

    if (typeof title === 'string') {
      taskTitle = title.trim();
    }

    if (typeof description === 'string') {
      taskDescription = description.trim();
    }

    if (isValidId === false) {
      return res.status(400).json({ message: 'Task id is invalid.' });
    }

    if (!taskTitle) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    let taskDueDate = null;

    if (dueDate) {
      const selectedDueDate = new Date(dueDate);
      const dueDateIsInvalid = Number.isNaN(selectedDueDate.getTime());

      if (dueDateIsInvalid === true) {
        return res.status(400).json({ message: 'Due date is invalid.' });
      }

      taskDueDate = selectedDueDate;
    }

    // Find this task only if it belongs to the logged-in user.
    const task = await Task.findOne({ _id: taskId, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = taskTitle;
    task.description = taskDescription;
    task.dueDate = taskDueDate;

    await task.save();

    res.json(task);

  } catch (error) {
    console.log('Failed to update task:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// Deletes a task
router.delete('/:id', async function (req, res) {
  try {
    const taskId = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(taskId);

    if (isValidId === false) {
      return res.status(400).json({ message: 'Task id is invalid.' });
    }

    const task = await Task.findOneAndDelete({ _id: taskId, user: req.userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted', task: task });

  } catch (error) {
    console.log('Failed to delete task:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

export default router;
