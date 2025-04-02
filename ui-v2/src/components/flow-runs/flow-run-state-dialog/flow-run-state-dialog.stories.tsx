import type { FlowRun } from "@/api/flow-runs";
import { Button } from "@/components/ui/button";
import { reactQueryDecorator } from "@/storybook/utils";
import type { Meta, StoryObj } from "@storybook/react";
import { FlowRunStateDialog } from "./flow-run-state-dialog";
import { useFlowRunStateDialog } from "./use-flow-run-state-dialog";

// Create a base mock flow run with required properties
const createMockFlowRun = (overrides: Partial<FlowRun> = {}): FlowRun => ({
	id: "mock-flow-run-id",
	created: "2023-10-15T10:00:00Z",
	updated: "2023-10-15T10:30:00Z",
	name: "Mock Flow Run",
	flow_id: "mock-flow-id",
	total_run_time: 1800,
	estimated_run_time: 1800,
	estimated_start_time_delta: 0,
	auto_scheduled: false,
	run_count: 1,
	...overrides,
});

// Mock flow run with COMPLETED state
const completedFlowRun = createMockFlowRun({
	id: "mock-flow-run-id-1",
	name: "Completed Flow Run",
	state: {
		id: "state-id-1",
		type: "COMPLETED",
		name: "Completed",
		timestamp: "2023-10-15T10:30:00Z",
		message: "Flow run completed successfully",
	},
});

// Mock flow run with FAILED state
const failedFlowRun = createMockFlowRun({
	id: "mock-flow-run-id-2",
	name: "Failed Flow Run",
	state: {
		id: "state-id-2",
		type: "FAILED",
		name: "Failed",
		timestamp: "2023-10-15T11:15:00Z",
		message: "Flow run failed with an error",
	},
	total_run_time: 900,
});

// Mock flow run with CANCELLED state
const cancelledFlowRun = createMockFlowRun({
	id: "mock-flow-run-id-3",
	name: "Cancelled Flow Run",
	state: {
		id: "state-id-3",
		type: "CANCELLED",
		name: "Cancelled",
		timestamp: "2023-10-15T12:05:00Z",
		message: "Flow run cancelled by user",
	},
	total_run_time: 300,
});

// Mock flow run with RUNNING state
const runningFlowRun = createMockFlowRun({
	id: "mock-flow-run-id-4",
	name: "Running Flow Run",
	state: {
		id: "state-id-4",
		type: "RUNNING",
		name: "Running",
		timestamp: "2023-10-15T13:00:00Z",
		message: "Flow run is in progress",
	},
	estimated_run_time: 3600,
});

// ------- Dialog Component Stories -------

const meta: Meta<typeof FlowRunStateDialog> = {
	title: "Components/FlowRuns/FlowRunStateDialog",
	component: FlowRunStateDialog,
	parameters: {
		layout: "centered",
	},
	decorators: [reactQueryDecorator],
	argTypes: {},
};

export default meta;
type Story = StoryObj<typeof FlowRunStateDialog>;

// Base story configuration
const baseStory: Story = {
	args: {
		open: true,
		onOpenChange: (open) => console.log(`Dialog open state: ${open}`),
	},
	parameters: {
		docs: {
			description: {
				story: "Dialog for changing the state of a flow run",
			},
		},
	},
};

export const CompletedFlowRun: Story = {
	...baseStory,
	args: {
		...baseStory.args,
		flowRun: completedFlowRun,
	},
};

export const FailedFlowRun: Story = {
	...baseStory,
	args: {
		...baseStory.args,
		flowRun: failedFlowRun,
	},
};

export const CancelledFlowRun: Story = {
	...baseStory,
	args: {
		...baseStory.args,
		flowRun: cancelledFlowRun,
	},
};

export const RunningFlowRun: Story = {
	...baseStory,
	args: {
		...baseStory.args,
		flowRun: runningFlowRun,
	},
};

// ------- Hook Usage Example -------

// Component that demonstrates how to use the useFlowRunStateDialog hook
const HookUsageDemo = () => {
	const [dialogState, openDialog] = useFlowRunStateDialog();

	return (
		<div className="space-y-4">
			<div className="p-4 border rounded-lg">
				<h2 className="text-lg font-medium mb-2">Hook Usage Example</h2>
				<p className="mb-4">
					Click the button below to open the dialog using the hook
				</p>
				<Button onClick={() => openDialog(completedFlowRun)}>
					Change Flow Run State
				</Button>
			</div>

			<FlowRunStateDialog {...dialogState} />
		</div>
	);
};

export const WithHook: StoryObj<typeof HookUsageDemo> = {
	render: () => <HookUsageDemo />,
	parameters: {
		docs: {
			description: {
				story:
					"Example of using the useFlowRunStateDialog hook to manage the dialog state",
			},
		},
	},
};
