import {DOCUMENT} from '@angular/common';
import {AfterViewInit, ChangeDetectionStrategy, Component, effect, ElementRef, inject, Injector, OnDestroy, Renderer2, signal} from '@angular/core';
import {fromEvent, map, Subject, take, takeUntil, throttleTime} from 'rxjs';

enum ResizeDirection {
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_MIDDLE = 'bottom-middle',
  BOTTOM_RIGHT = 'bottom-right',
  MIDDLE_LEFT = 'middle-left',
  MIDDLE_RIGHT = 'middle-right',
  TOP_LEFT = 'top-left',
  TOP_MIDDLE = 'top-middle',
  TOP_RIGHT = 'top-right',
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  height: number;
  width: number;
}

const MILLISECONDS_PER_FRAME = 1000 / 60;
const SELECTED_CLASS_NAME = 'selected';


@Component({
  selector: 'simple-resizable',
  standalone: true,
  imports: [],
  templateUrl: './simple-resizable.html',
  styleUrl: './simple-resizable.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleResizable implements AfterViewInit, OnDestroy {
  protected readonly currentSize = signal<Size>({width: 0, height: 0});
  private readonly destroy$ = new Subject<void>();
  private readonly document = inject(DOCUMENT);
  private readonly hostElementRef = inject(ElementRef);
  private injector = inject(Injector);
  protected readonly isSelected = signal(false);
  protected readonly originalSize = signal<Size>({width: 0, height: 0});
  private readonly renderer = inject(Renderer2);
  protected readonly ResizeDirection = ResizeDirection;


  ngAfterViewInit() {
    this.initializeSizes();
    this.configureEventListeners();
  }

  configureEventListeners() {
    // Listen to click on the host element.
    fromEvent<MouseEvent>(this.hostElementRef.nativeElement, 'click')
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: MouseEvent) => {
          if (this.hostElementRef.nativeElement === event.target ||
              this.hostElementRef.nativeElement.contains(event.target)) {
            this.isSelected.set(true);
            this.renderer.addClass(
                this.hostElementRef.nativeElement, SELECTED_CLASS_NAME);
          }

          event.stopPropagation();
        });

    // Listen to click on the document.
    fromEvent<MouseEvent>(this.document, 'click')
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: MouseEvent) => {
          if (this.isSelected() &&
              !this.hostElementRef.nativeElement.contains(event.target)) {
            this.isSelected.set(false);
            this.renderer.removeClass(
                this.hostElementRef.nativeElement, SELECTED_CLASS_NAME);
          }
        });
  }

  initializeSizes() {
    const hostElementBoundingClientRect =
        this.hostElementRef.nativeElement.getBoundingClientRect();

    this.originalSize.set({
      height: hostElementBoundingClientRect.height,
      width: hostElementBoundingClientRect.width
    });

    this.currentSize.set({
      height: hostElementBoundingClientRect.height,
      width: hostElementBoundingClientRect.width
    });

    // Update the host element whenever the value of `currentSize` changes.
    effect(() => {
      this.hostElementRef.nativeElement.style.width =
          `${this.currentSize().width}px`;
      this.hostElementRef.nativeElement.style.height =
          `${this.currentSize().height}px`;
    }, {injector: this.injector});
  }

  protected startResize(event: MouseEvent) {
    const mousemove$ = fromEvent<MouseEvent>(this.document, 'mousemove');
    const mouseup$ =
        fromEvent<MouseEvent>(this.document, 'mouseup').pipe(take(1));

    const clickX = event.clientX;
    const clickY = event.clientY;
    const hostElementSizeAtStartDrag: Size = this.currentSize();

    mousemove$
        .pipe(
            // Stop listening on mouseup.
            takeUntil(mouseup$),
            // Throttle to ~60 FPS.
            throttleTime(MILLISECONDS_PER_FRAME),
            map((event: MouseEvent) => {
              const dragOffset: Point = {
                x: event.clientX - clickX,
                y: event.clientY - clickY,
              };

              return dragOffset;
            }),
            )
        .subscribe((dragOffset) => {
          const eventElement = event.target as HTMLElement;
          const classList = eventElement.classList;
          const isLeftHandle =
              (classList.contains(ResizeDirection.BOTTOM_LEFT) ||
               classList.contains(ResizeDirection.MIDDLE_LEFT) ||
               classList.contains(ResizeDirection.TOP_LEFT));
          const isTopHandle =
              (classList.contains(ResizeDirection.TOP_LEFT) ||
               classList.contains(ResizeDirection.TOP_MIDDLE) ||
               classList.contains(ResizeDirection.TOP_RIGHT));
          const isMiddleHandle =
              (classList.contains(ResizeDirection.MIDDLE_LEFT) ||
               classList.contains(ResizeDirection.MIDDLE_RIGHT));
          const isBottomOrTopMiddleHandle =
              (classList.contains(ResizeDirection.TOP_MIDDLE) ||
               classList.contains(ResizeDirection.BOTTOM_MIDDLE));

          let dragOffsetX = dragOffset.x;
          let dragOffsetY = dragOffset.y;

          // Flip x coordinates.
          if (isLeftHandle) {
            dragOffsetX = dragOffset.x * -1;
          }

          // Flip y coordinates.
          if (isTopHandle) {
            dragOffsetY = dragOffset.y * -1;
          }

          // No change in y dimension.
          if (isMiddleHandle) {
            dragOffsetY = 0;
          }

          // No change in x dimension.
          if (isBottomOrTopMiddleHandle) {
            dragOffsetX = 0;
          }

          this.currentSize.set({
            width: hostElementSizeAtStartDrag.width + (dragOffsetX * 2),
            height: hostElementSizeAtStartDrag.height + (dragOffsetY * 2)
          });
        });

    // Prevent event from propagating to drag position handling via `cdkDrag`;
    event.stopPropagation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
