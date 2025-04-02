import type { Deployment } from "@/api/deployments";
import type { Flow } from "@/api/flows";
import type { components } from "@/api/prefect";
import { getQueryService } from "@/api/service";
import {
	keepPreviousData,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

export type FlowRun = components["schemas"]["FlowRun"];
export type FlowRunWithFlow = FlowRun & {
	flow: Flow;
};
export type FlowRunWithDeploymentAndFlow = FlowRun & {
	deployment: Deployment;
	flow: Flow;
};
export type FlowRunsFilter =
	components["schemas"]["Body_read_flow_runs_flow_runs_filter_post"];

export type FlowRunsPaginateFilter =
	components["schemas"]["Body_paginate_flow_runs_flow_runs_paginate_post"];

export type CreateNewFlowRun = components["schemas"]["DeploymentFlowRunCreate"];

/**
 * Query key factory for flows-related queries
 *
 * @property {function} all - Returns base key for all flow run queries
 * @property {function} lists - Returns key for all list-type flow run queries
 * @property {function} list - Generates key for a specific filtered flow run query
 * @property {function} paginate - Returns key for all paginated flow run queries
 * @property {function} details - Returns key for all details-type flow run queries
 * @property {function} detail - Generates key for a specific details-type flow run query
 *
 * ```
 * all    	=> 	['flowRuns']
 * lists  	=>  ['flowRuns', 'list']
 * filter	=>	['flowRuns', 'list', 'filter', {...filters}]
 * paginate	=>	['flowRuns', 'list', 'paginate', {...filters}]
 * details	=>	['flowRuns', 'details']
 * detail	=>	['flowRuns', 'details', id]
 * ```
 */
export const queryKeyFactory = {
	all: () => ["flowRuns"] as const,
	lists: () => [...queryKeyFactory.all(), "list"] as const,
	filter: (filter: FlowRunsFilter) =>
		[...queryKeyFactory.lists(), "filter", filter] as const,
	paginate: (filter: FlowRunsPaginateFilter) =>
		[...queryKeyFactory.lists(), "paginate", filter] as const,
	details: () => [...queryKeyFactory.all(), "details"] as const,
	detail: (id: string) => [...queryKeyFactory.details(), id] as const,
};

/**
 * Builds a query configuration for fetching filtered flow runs
 *
 * @param filter - Filter parameters for the flow runs query.
 * @returns Query configuration object for use with TanStack Query
 *
 * @example
 * ```ts
 * const { data, isLoading, error } = useQuery(buildFilterFlowRunsQuery({
 *   offset: 0,
 *   sort: "CREATED_DESC",
 *   flow_runs: {
 *     name: { like_: "my-flow-run" }
 *   }
 * }));
 * ```
 */
export const buildFilterFlowRunsQuery = (
	filter: FlowRunsFilter = {
		sort: "ID_DESC",
		offset: 0,
	},
	refetchInterval = 30_000,
) => {
	return queryOptions({
		queryKey: queryKeyFactory.filter(filter),
		queryFn: async () => {
			const res = await getQueryService().POST("/flow_runs/filter", {
				body: filter,
			});
			return res.data ?? ([] satisfies FlowRun[]);
		},
		staleTime: 1000,
		refetchInterval,
	});
};

/**
 * Builds a query configuration for fetching filtered flow runs
 *
 * @param filter - Filter parameters for the flow runs pagination query.
 * @returns Query configuration object for use with TanStack Query
 *
 * @example
 * ```ts
 * const { data } = useSuspenseQuery(buildPaginateFlowRunsQuery());
 * ```
 */
export const buildPaginateFlowRunsQuery = (
	filter: FlowRunsPaginateFilter = {
		page: 1,
		sort: "START_TIME_DESC",
	},
	refetchInterval = 30_000,
) => {
	return queryOptions({
		queryKey: queryKeyFactory.paginate(filter),
		queryFn: async () => {
			const res = await getQueryService().POST("/flow_runs/paginate", {
				body: filter,
			});
			if (!res.data) {
				throw new Error("'data' expected");
			}
			return res.data;
		},
		placeholderData: keepPreviousData,
		staleTime: 1000,
		refetchInterval,
	});
};

/**
 * Builds a query configuration for fetching a flow run by id
 *
 * @param id - The id of the flow run to fetch
 * @returns Query configuration object for use with TanStack Query
 *
 * @example
 * ```ts
 * const { data } = useSuspenseQuery(buildGetFlowRunDetailsQuery("id-0"));
 * ```
 */
export const buildGetFlowRunDetailsQuery = (id: string) => {
	return queryOptions({
		queryKey: queryKeyFactory.detail(id),
		queryFn: async () => {
			const res = await getQueryService().GET("/flow_runs/{id}", {
				params: { path: { id } },
			});

			if (!res.data) {
				throw new Error(
					`Received empty response from server for flow run ${id}`,
				);
			}
			return res.data;
		},
	});
};

// ----- ✍🏼 Mutations 🗄️
// ----------------------------

/**
 * Hook for deleting a flow run
 *
 * @returns Mutation object for deleting a flow run with loading/error states and trigger function
 *
 * @example
 * ```ts
 * const { deleteFlowRun, isLoading } = useDeleteFlowRun();
 *
 * deleteflowRun(id, {
 *   onSuccess: () => {
 *     // Handle successful deletion
 *     console.log('Flow run deleted successfully');
 *   },
 *    (error) => {
 *     // Handle error
 *     console.error('Failed to delete flow run:', error);
 *   }
 * });
 * ```
 */
export const useDeleteFlowRun = () => {
	const queryClient = useQueryClient();
	const { mutate: deleteFlowRun, ...rest } = useMutation({
		mutationFn: (id: string) =>
			getQueryService().DELETE("/flow_runs/{id}", {
				params: { path: { id } },
			}),
		onSuccess: () => {
			// After a successful creation, invalidate only list queries to refetch
			return queryClient.invalidateQueries({
				queryKey: queryKeyFactory.lists(),
			});
		},
	});
	return {
		deleteFlowRun,
		...rest,
	};
};

type MutateCreateFlowRun = {
	id: string;
} & CreateNewFlowRun;
/**
 * Hook for creating a new flow run from an automation
 *
 * @returns Mutation object for creating a flow run with loading/error states and trigger function
 *
 * @example
 * ```ts
 * const { createDeploymentFlowRun, isLoading } = useDeploymentCreateFlowRun();
 *
 * createDeploymentFlowRun({ deploymentId, ...body }, {
 *   onSuccess: () => {
 *     // Handle successful creation
 *     console.log('Flow run created successfully');
 *   },
 *    (error) => {
 *     // Handle error
 *     console.error('Failed to create flow run:', error);
 *   }
 * });
 * ```
 */
export const useDeploymentCreateFlowRun = () => {
	const queryClient = useQueryClient();
	const { mutate: createDeploymentFlowRun, ...rest } = useMutation({
		mutationFn: async ({ id, ...body }: MutateCreateFlowRun) => {
			const res = await getQueryService().POST(
				"/deployments/{id}/create_flow_run",
				{
					body,
					params: { path: { id } },
				},
			);

			if (!res.data) {
				throw new Error("'data' expected");
			}
			return res.data;
		},
		onSuccess: () => {
			// After a successful creation, invalidate only list queries to refetch
			return queryClient.invalidateQueries({
				queryKey: queryKeyFactory.lists(),
			});
		},
	});
	return {
		createDeploymentFlowRun,
		...rest,
	};
};
