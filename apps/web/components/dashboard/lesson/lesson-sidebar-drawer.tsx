'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { lessonPlayerCopy, type LessonPlayerDto } from '../../../lib/dashboard';
import { LessonSidebar } from './lesson-sidebar';

const MenuIcon = icons.menu;

export function LessonSidebarDrawer({ data }: { data: LessonPlayerDto }): React.JSX.Element {
  return (
    <div className="laptop:hidden">
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="md" className="w-full">
            <MenuIcon className="h-4 w-4" aria-hidden />
            {lessonPlayerCopy.openCurriculum}
          </Button>
        </DialogTrigger>
        <DialogContent
          size="fullscreen"
          className="flex max-h-[100dvh] flex-col overflow-hidden p-0 sm:max-w-md sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:w-full sm:max-w-md sm:translate-x-0 sm:translate-y-0 sm:rounded-none"
        >
          <DialogHeader className="border-b border-border px-4 py-4 pr-12">
            <DialogTitle>{lessonPlayerCopy.curriculumLabel}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <LessonSidebar data={data} className="border-0 shadow-none" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
