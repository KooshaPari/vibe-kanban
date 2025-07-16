use std::collections::HashMap;
use uuid::Uuid;

use crate::{
    app_state::AppState,
    models::{
        project::Project,
        project_manager_session::{MessageRole, ProjectManagerMessage, ProjectManagerSession},
        task::{CreateTask, CreateTaskAndStart, Task, TaskStatus},
        task_attempt::TaskAttempt,
    },
};

pub struct ProjectManagerService;

impl ProjectManagerService {
    pub async fn process_message(
        app_state: &AppState,
        project_id: Uuid,
        session_id: Uuid,
        user_message: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Load project context
        let project = Project::find_by_id(&app_state.db_pool, project_id)
            .await?
            .ok_or("Project not found")?;

        // Load conversation history for context
        let messages = ProjectManagerMessage::find_by_session_id(&app_state.db_pool, session_id).await?;

        // Load current project tasks for context
        let tasks = Task::find_by_project_id(&app_state.db_pool, project_id).await?;

        // Analyze the user's message and generate appropriate response
        let response = Self::generate_agent_response(
            &project,
            &messages,
            &tasks,
            user_message,
        ).await?;

        Ok(response)
    }

    async fn generate_agent_response(
        project: &Project,
        _conversation_history: &[ProjectManagerMessage],
        tasks: &[Task],
        user_message: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let message_lower = user_message.to_lowercase();
        
        // Intent analysis - simple keyword matching for now
        // In a real implementation, this would use an LLM or more sophisticated NLP
        
        if message_lower.contains("create task") || message_lower.contains("new task") || message_lower.contains("add task") {
            Self::handle_task_creation_intent(project, tasks, user_message).await
        } else if message_lower.contains("list task") || message_lower.contains("show task") || message_lower.contains("current task") {
            Self::handle_task_listing_intent(tasks).await
        } else if message_lower.contains("status") || message_lower.contains("progress") {
            Self::handle_status_intent(project, tasks).await
        } else if message_lower.contains("prd") || message_lower.contains("requirement") || message_lower.contains("specification") {
            Self::handle_prd_intent(user_message).await
        } else if message_lower.contains("help") || message_lower.contains("what can you do") {
            Self::handle_help_intent().await
        } else {
            Self::handle_general_intent(project, user_message).await
        }
    }

    async fn handle_task_creation_intent(
        project: &Project,
        tasks: &[Task],
        user_message: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let task_count = tasks.len();
        let todo_count = tasks.iter().filter(|t| t.status == TaskStatus::Todo).count();
        let in_progress_count = tasks.iter().filter(|t| t.status == TaskStatus::InProgress).count();

        Ok(format!(
            "I can help you create new tasks! Based on your message: \"{}\"

**Current Project Status:**
- Total tasks: {}
- Todo: {}
- In Progress: {}

**To create tasks, I can:**

1. **Break down your request into specific tasks**
   - Analyze requirements and create actionable items
   - Suggest task priorities and dependencies
   - Estimate complexity and effort

2. **Create multiple related tasks**
   - Epic/feature breakdown
   - Implementation phases
   - Testing and documentation tasks

3. **Assign appropriate executors**
   - Match tasks to suitable AI agents (Claude, Gemini, etc.)
   - Consider task complexity and type

**Would you like me to:**
- Create specific tasks based on your request above?
- Help you write a more detailed task description?
- Break down a larger feature into smaller tasks?

Please provide more details about what you'd like to accomplish, and I'll help create the appropriate tasks!",
            user_message,
            task_count,
            todo_count,
            in_progress_count
        ))
    }

    async fn handle_task_listing_intent(
        tasks: &[Task],
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        if tasks.is_empty() {
            return Ok("**No tasks found in this project.**

This project doesn't have any tasks yet. Would you like me to help you create some tasks to get started?

I can help you:
- Break down project requirements into manageable tasks
- Create initial setup and infrastructure tasks
- Plan feature development tasks
- Set up testing and documentation tasks".to_string());
        }

        let mut response = format!("**Current Project Tasks ({} total):**\n\n", tasks.len());

        // Group tasks by status
        let mut task_groups: HashMap<TaskStatus, Vec<&Task>> = HashMap::new();
        for task in tasks {
            task_groups.entry(task.status.clone()).or_default().push(task);
        }

        for (status, task_list) in task_groups {
            let status_emoji = match status {
                TaskStatus::Todo => "📋",
                TaskStatus::InProgress => "🚀",
                TaskStatus::InReview => "👀",
                TaskStatus::Done => "✅",
                TaskStatus::Cancelled => "❌",
            };

            response.push_str(&format!("## {} {:?} ({})\n", status_emoji, status, task_list.len()));

            for task in task_list {
                let description_preview = task.description
                    .as_ref()
                    .map(|d| {
                        if d.len() > 100 {
                            format!("{}...", &d[..100])
                        } else {
                            d.clone()
                        }
                    })
                    .unwrap_or_else(|| "No description".to_string());

                response.push_str(&format!(
                    "- **{}**\n  {}\n",
                    task.title,
                    description_preview
                ));
            }
            response.push('\n');
        }

        response.push_str("**What would you like to do next?**\n");
        response.push_str("- Create new tasks\n");
        response.push_str("- Review or update existing tasks\n");
        response.push_str("- Start execution on todo tasks\n");
        response.push_str("- Analyze project progress\n");

        Ok(response)
    }

    async fn handle_status_intent(
        project: &Project,
        tasks: &[Task],
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let total = tasks.len();
        let todo = tasks.iter().filter(|t| t.status == TaskStatus::Todo).count();
        let in_progress = tasks.iter().filter(|t| t.status == TaskStatus::InProgress).count();
        let in_review = tasks.iter().filter(|t| t.status == TaskStatus::InReview).count();
        let done = tasks.iter().filter(|t| t.status == TaskStatus::Done).count();
        let cancelled = tasks.iter().filter(|t| t.status == TaskStatus::Cancelled).count();

        let completion_rate = if total > 0 {
            (done as f64 / total as f64 * 100.0).round() as u32
        } else {
            0
        };

        Ok(format!(
            "# 📊 Project Status: **{}**\n\n\
            **Overall Progress:** {}% complete ({}/{} tasks)\n\n\
            **Task Breakdown:**\n\
            - 📋 **Todo:** {} tasks\n\
            - 🚀 **In Progress:** {} tasks\n\
            - 👀 **In Review:** {} tasks\n\
            - ✅ **Done:** {} tasks\n\
            - ❌ **Cancelled:** {} tasks\n\n\
            **Project Configuration:**\n\
            - Repository: `{}`\n\
            - Setup Script: {}\n\
            - Dev Script: {}\n\n\
            **Recommendations:**\n\
            {}\n\n\
            **How can I help you move forward?**\n\
            - Review and prioritize todo tasks\n\
            - Start execution on ready tasks\n\
            - Create additional tasks\n\
            - Analyze blockers or issues",
            project.name,
            completion_rate,
            done,
            total,
            todo,
            in_progress,
            in_review,
            done,
            cancelled,
            project.git_repo_path,
            project.setup_script.as_ref().map(|_| "✅ Configured").unwrap_or("❌ Not configured"),
            project.dev_script.as_ref().map(|_| "✅ Configured").unwrap_or("❌ Not configured"),
            Self::generate_recommendations(todo, in_progress, done, total)
        ))
    }

    fn generate_recommendations(todo: usize, in_progress: usize, done: usize, total: usize) -> String {
        if total == 0 {
            "Consider creating initial tasks to get started with the project.".to_string()
        } else if in_progress == 0 && todo > 0 {
            "You have tasks ready to start! Consider beginning execution on some todo tasks.".to_string()
        } else if in_progress > 3 {
            "You have many tasks in progress. Consider focusing on completing current tasks before starting new ones.".to_string()
        } else if done as f64 / total as f64 > 0.8 {
            "Great progress! You're near completion. Consider planning next phase or cleanup tasks.".to_string()
        } else {
            "Good momentum! Continue working through your task pipeline.".to_string()
        }
    }

    async fn handle_prd_intent(
        user_message: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(format!(
            "I can help you with Product Requirements Document (PRD) analysis and task generation!\n\n\
            **Based on your message:** \"{}\"\n\n\
            **I can help you:**\n\n\
            1. **Analyze PRD content**\n\
               - Break down requirements into technical tasks\n\
               - Identify dependencies and critical path\n\
               - Suggest implementation approaches\n\n\
            2. **Create task structure from PRD**\n\
               - Feature breakdown structure\n\
               - Technical implementation tasks\n\
               - Testing and validation tasks\n\
               - Documentation requirements\n\n\
            3. **Review and validate requirements**\n\
               - Check for completeness and clarity\n\
               - Identify potential technical challenges\n\
               - Suggest missing requirements\n\n\
            **To get started:**\n\
            - Share your PRD content or requirements\n\
            - Describe the feature you want to implement\n\
            - Ask me to analyze existing project files for requirements\n\n\
            I'll help transform your requirements into actionable development tasks!",
            user_message
        ))
    }

    async fn handle_help_intent() -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(r#"# 🤖 Project Manager Agent - Help Guide

I'm your AI project manager! Here's what I can help you with:

## 🎯 **Core Capabilities**

### **Task Management**
- Create and organize tasks from requirements
- Break down epics into manageable work items
- Assign appropriate AI executors to tasks
- Track progress and identify blockers

### **Requirements Analysis** 
- Analyze PRDs and technical specifications
- Transform requirements into actionable tasks
- Identify dependencies and critical path
- Suggest implementation approaches

### **Project Coordination**
- Monitor overall project health and progress
- Coordinate between different AI workers
- Provide status updates and recommendations
- Help prioritize work and resources

### **Team Management**
- Assign tasks to appropriate agents (Claude, Gemini, etc.)
- Track execution progress across agents
- Coordinate code reviews and quality checks
- Manage project timelines and milestones

## 💬 **How to Interact with Me**

**Task Creation:**
- "Create tasks for implementing user authentication"
- "Break down the shopping cart feature into tasks"
- "I need tasks for the new API endpoints"

**Status & Progress:**
- "What's the current project status?"
- "Show me all tasks"
- "How are we progressing?"

**Requirements & Planning:**
- "Help me analyze this PRD"
- "What tasks do we need for this feature?"
- "Review these requirements"

**General Questions:**
- "What should we work on next?"
- "Help me prioritize tasks"
- "What are the project blockers?"

## 🚀 **Getting Started**

1. **Share your goals** - Tell me what you want to accomplish
2. **Provide context** - Share PRDs, requirements, or ideas
3. **Let me help** - I'll suggest tasks and next steps
4. **Stay coordinated** - Keep me updated on progress and blockers

Ready to boost your project productivity? What would you like to work on today?"#.to_string())
    }

    async fn handle_general_intent(
        project: &Project,
        user_message: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Ok(format!(
            "I understand you want to work on: **\"{}\"**\n\n\
            Let me help you break this down for the **{}** project.\n\n\
            **I can assist with:**\n\n\
            🎯 **Task Planning & Creation**\n\
            - Break your request into specific, actionable tasks\n\
            - Suggest implementation approaches and priorities\n\
            - Create tasks with appropriate complexity estimates\n\n\
            🤖 **Agent Coordination**\n\
            - Recommend which AI executors to assign (Claude, Gemini, etc.)\n\
            - Plan task dependencies and execution order\n\
            - Monitor progress across multiple agents\n\n\
            📋 **Project Management**\n\
            - Track overall progress and identify blockers\n\
            - Coordinate code reviews and quality checks\n\
            - Provide status updates and recommendations\n\n\
            **To help you better, could you provide:**\n\
            - More specific details about what you want to implement\n\
            - Any requirements, constraints, or preferences\n\
            - Timeline or priority considerations\n\
            - Technical approach preferences\n\n\
            Once I have more context, I can create specific tasks and help coordinate the work!",
            user_message,
            project.name
        ))
    }
}

// MCP Tool implementations for project manager
impl ProjectManagerService {
    pub async fn create_tasks_from_requirements(
        app_state: &AppState,
        project_id: Uuid,
        requirements: &str,
        task_prefix: Option<String>,
    ) -> Result<Vec<Task>, Box<dyn std::error::Error + Send + Sync>> {
        // This would be enhanced with actual LLM integration
        // For now, create a simple example task
        let prefix = task_prefix.unwrap_or_else(|| "Generated".to_string());
        
        let task = Task::create(
            &app_state.db_pool,
            CreateTask {
                project_id,
                title: format!("{}: Implement requirements", prefix),
                description: Some(format!("Generated from requirements:\n\n{}", requirements)),
            },
        ).await?;

        Ok(vec![task])
    }

    pub async fn analyze_project_health(
        app_state: &AppState,
        project_id: Uuid,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let project = Project::find_by_id(&app_state.db_pool, project_id)
            .await?
            .ok_or("Project not found")?;

        let tasks = Task::find_by_project_id(&app_state.db_pool, project_id).await?;
        
        Self::handle_status_intent(&project, &tasks).await
    }

    pub async fn suggest_next_actions(
        app_state: &AppState,
        project_id: Uuid,
    ) -> Result<Vec<String>, Box<dyn std::error::Error + Send + Sync>> {
        let tasks = Task::find_by_project_id(&app_state.db_pool, project_id).await?;
        
        let todo_count = tasks.iter().filter(|t| t.status == TaskStatus::Todo).count();
        let in_progress_count = tasks.iter().filter(|t| t.status == TaskStatus::InProgress).count();
        
        let mut suggestions = Vec::new();
        
        if todo_count > 0 {
            suggestions.push("Start execution on todo tasks".to_string());
        }
        
        if in_progress_count == 0 && todo_count > 0 {
            suggestions.push("Begin work on highest priority tasks".to_string());
        }
        
        if tasks.is_empty() {
            suggestions.push("Create initial project tasks".to_string());
        }
        
        suggestions.push("Review and update project requirements".to_string());
        
        Ok(suggestions)
    }
}