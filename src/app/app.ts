import {CdkDrag, CdkDragStart} from '@angular/cdk/drag-drop';
import {Component} from '@angular/core';

import {SimpleResizable} from '../simple_resizable/simple-resizable/simple-resizable';

@Component({
  selector: 'simple-resizable-demo',
  standalone: true,
  imports: [
    CdkDrag,
    SimpleResizable,
  ],
  templateUrl: './app.ng.html',
  styleUrl: './app.scss'
})
export class App {
}
