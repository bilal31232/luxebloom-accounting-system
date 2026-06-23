import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseService } from '../services/expenseService';

export const useExpenses = () => useQuery({
  queryKey: ['expenses'],
  queryFn: expenseService.getExpenses,
});

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });
};