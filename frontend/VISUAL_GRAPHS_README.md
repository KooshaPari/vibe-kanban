# Visual Graphs Feature

## Overview

The Visual Graphs feature provides intuitive visualizations for tracking agent progress and git state changes in Vibe Kanban. This feature includes two main components:

### 🏁 Agent Progress Race Visualization
A race-track style visualization that shows agents competing from start to finish line, providing real-time insights into task execution progress.

**Key Features:**
- Real-time progress tracking through execution phases
- Visual indicators for different agent types (Claude, Amp, Gemini, etc.)
- Animated progress bars with status-specific colors
- Interactive selection and error state visualization
- Agents move backwards when encountering errors

### 🌳 Git State Tree Visualization  
A tree-like visualization representing git branching, pull requests, and merge operations throughout the development process.

**Key Features:**
- Dynamic node positioning based on task attempts
- Branch creation and merge visualization
- PR tracking with status indicators
- Interactive node selection with detailed information
- Connection lines showing git flow relationships

## Usage

1. **Navigate to Task Details**: Open any task that has been executed
2. **Select Visualizations Tab**: Click on the "Visualizations" tab in the task details panel
3. **Interact with Visualizations**: 
   - Click on agents in the race track to select specific attempts
   - Click on nodes in the git tree to see branch details
   - Use the synchronized selection between both visualizations

## Technical Architecture

### Components Structure
```
TaskDetailsPanel
├── TabNavigation (enhanced with Visualizations tab)
├── VisualizationsTab
    ├── AgentProgressRaceVisualization
    └── GitStateTreeVisualization
```

### Data Flow
- Task attempts are fetched by `TaskDetailsToolbar`
- Data is shared via `TaskAttemptsContext` 
- `VisualizationsTab` processes and distributes data
- Individual components render interactive visualizations

### Key Technologies
- React 18 with TypeScript
- Tailwind CSS for responsive styling
- SVG for scalable graphics
- Lucide React for consistent icons
- React Context for state management

## Performance Considerations

- **Efficient Rendering**: Components use memoization to prevent unnecessary re-renders
- **Real-time Updates**: Data refreshes every 2 seconds during active processes
- **Scalable Design**: Handles multiple concurrent agents and large datasets
- **Responsive**: Optimized for both desktop and mobile devices

## Implementation Details

### Agent Progress Calculation
```typescript
const calculateRacePosition = (state: ExecutionState): number => {
  const index = EXECUTION_STATES_ORDER.indexOf(state);
  return (index / (EXECUTION_STATES_ORDER.length - 1)) * 100;
};
```

### Git Node Positioning
```typescript
interface GitNode {
  id: string;
  type: 'branch' | 'merge' | 'pr';
  position: { x: number; y: number };
  status: 'active' | 'merged' | 'failed' | 'pending';
}
```

### Execution States
The system tracks the following execution states:
- `NotStarted` → `SetupRunning` → `SetupComplete` → `CodingAgentRunning` → `CodingAgentComplete` → `Complete`
- Error states: `SetupFailed`, `CodingAgentFailed`

## Future Enhancements

### Planned Features
- **Historical Timeline**: View project evolution over time
- **Performance Analytics**: Detailed agent performance metrics
- **Export Functionality**: PDF/PNG export of visualizations
- **Real-time Collaboration**: Live updates for team environments
- **Custom Themes**: User-customizable visualization colors

### Advanced Analytics
- **Trend Analysis**: Identify patterns in agent performance
- **Bottleneck Detection**: Highlight common failure points
- **Recommendation Engine**: Suggest optimizations based on data
- **Team Metrics**: Aggregate insights across team members

## Accessibility

The visualizations are designed with accessibility in mind:
- **High Contrast**: Clear visual distinction between states
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Responsive Design**: Works across all device sizes

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

When contributing to the visual graphs feature:

1. **Follow Existing Patterns**: Use established component and context patterns
2. **Maintain Performance**: Profile any changes for performance impact
3. **Test Thoroughly**: Ensure cross-browser compatibility
4. **Document Changes**: Update this README for new features
5. **Consider Accessibility**: Maintain WCAG 2.1 AA compliance

## Troubleshooting

### Common Issues

**Visualizations not loading:**
- Ensure task has at least one attempt
- Check that execution processes have been created
- Verify network connectivity for real-time updates

**Performance issues:**
- Check for large datasets (>50 attempts)
- Monitor browser console for errors
- Verify memory usage in development tools

**Styling issues:**
- Ensure all Tailwind CSS classes are included in build
- Check for conflicting CSS rules
- Verify responsive breakpoints

### Debug Mode

Enable debug logging by setting:
```javascript
window.VIBE_KANBAN_DEBUG = true;
```

This will log visualization data updates to the browser console.

## License

This feature is part of the Vibe Kanban project and follows the same licensing terms.

---

**Version**: 1.0.0  
**Last Updated**: January 16, 2025  
**Maintainer**: Vibe Kanban Development Team