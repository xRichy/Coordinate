"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@coordinate/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, Clock, CheckCircle2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { useTRPC } from "@/lib/trpc";

type Task = inferRouterOutputs<AppRouter>["activities"]["task"]["list"][number];

export default function TasksPage() {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { data: tasks = [] } = useQuery(trpc.activities.task.list.queryOptions());
    const updateStatus = useMutation(
        trpc.activities.task.updateStatus.mutationOptions({
            onSuccess: () => queryClient.invalidateQueries(trpc.activities.task.list.queryOptions()),
        })
    );
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTasks = tasks.filter((t: Task) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "High": return "text-destructive border-destructive/20 bg-destructive/10";
            case "Medium": return "text-orange-500 border-orange-500/20 bg-orange-500/10";
            case "Low": return "text-green-500 border-green-500/20 bg-green-500/10";
            default: return "";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Done": return <CheckCircle2 className="h-4 w-4 text-primary" />;
            case "In Progress": return <Clock className="h-4 w-4 text-orange-500" />;
            default: return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
        }
    };

    return (
        <div className="flex-1 space-y-6">
            <div className="flex flex-col sm:flex-row shadow-sm bg-card/40 backdrop-blur-md border border-border/50 p-6 rounded-xl justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
                    <p className="text-muted-foreground">Keep track of your daily activities and follow-ups.</p>
                </div>
                <Button className="shrink-0 group">
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
                    Create Task
                </Button>
            </div>

            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl overflow-hidden shadow-sm p-3">
                <div className="p-4 flex flex-col sm:flex-row items-center gap-4 border-b border-border/50">
                    <div className="relative flex-1 w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-8 bg-background/50 border-border/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="bg-background/50 border-border/50 w-full sm:w-auto">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            Filter by Date
                        </Button>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent border-border/50">
                            <TableHead className="w-[400px]">Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTasks.length > 0 ? (
                            filteredTasks.map((task: Task) => (
                                <TableRow key={task.id} className="border-border/50 hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(task.status)}
                                            <span className={task.status === "Done" ? "line-through text-muted-foreground" : ""}>
                                                {task.title}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={task.status}
                                            onValueChange={(value: "Todo" | "In Progress" | "Done") =>
                                                updateStatus.mutate({ id: task.id, status: value })
                                            }
                                        >
                                            <SelectTrigger className="w-[140px] h-8 text-xs bg-background/50 border-border/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Todo">Todo</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(parseISO(task.dueDate), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 hover:text-destructive">
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No tasks found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
