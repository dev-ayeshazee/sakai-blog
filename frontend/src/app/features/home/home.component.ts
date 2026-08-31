import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  RowClickedEvent,
} from 'ag-grid-community';
import { PostService } from '../../core/services/post.service';
import { PostListItem } from '../../core/models/post.model';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private gridApi?: GridApi<PostListItem>;

  readonly defaultColDef: ColDef = {
    sortable: false,
    resizable: true,
    suppressMovable: true,
  };

  readonly columnDefs: ColDef<PostListItem>[] = [
    { headerName: 'Title', field: 'title', flex: 2, minWidth: 200 },
    {
      headerName: 'Excerpt',
      field: 'excerpt',
      flex: 3,
      minWidth: 260,
      valueFormatter: (p) => (p.value ?? '').slice(0, 200),
      tooltipField: 'excerpt',
    },
    {
      headerName: 'Author',
      colId: 'author',
      flex: 1,
      minWidth: 130,
      valueGetter: (p) => p.data?.author?.name ?? '',
    },
    {
      headerName: 'Published',
      field: 'publishedAt',
      flex: 1,
      minWidth: 130,
      valueFormatter: (p) =>
        p.value ? new Date(p.value).toLocaleDateString() : '',
    },
  ];

  /** Infinite row model datasource -> server-side pagination (5 per page). */
  private readonly datasource: IDatasource = {
    getRows: (params: IGetRowsParams) => {
      const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
      this.posts.list(page, PAGE_SIZE).subscribe({
        next: (res) => params.successCallback(res.data, res.meta.total),
        error: () => params.failCallback(),
      });
    },
  };

  readonly gridOptions = {
    rowModelType: 'infinite' as const,
    cacheBlockSize: PAGE_SIZE,
    paginationPageSize: PAGE_SIZE,
    paginationPageSizeSelector: false as const,
    pagination: true,
    animateRows: true,
    rowHeight: 48,
    maxBlocksInCache: 10,
  };

  constructor(
    private readonly posts: PostService,
    private readonly router: Router,
  ) {}

  onGridReady(event: GridReadyEvent<PostListItem>): void {
    this.gridApi = event.api;
    event.api.setGridOption('datasource', this.datasource);
  }

  onRowClicked(event: RowClickedEvent<PostListItem>): void {
    if (event.data) this.router.navigate(['/posts', event.data.id]);
  }
}
