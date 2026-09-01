import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  RowClickedEvent,
} from 'ag-grid-community';
import { PostService } from '../../core/services/post.service';
import {
  PostListItem,
  PostListQuery,
  PostSortField,
} from '../../core/models/post.model';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private gridApi?: GridApi<PostListItem>;
  private readonly search$ = new Subject<void>();

  /** Global search box (title / body / author), debounced. */
  searchTerm = '';
  totalCount = 0;

  readonly defaultColDef: ColDef = {
    resizable: true,
    suppressMovable: true,
  };

  readonly columnDefs: ColDef<PostListItem>[] = [
    {
      headerName: 'Title',
      field: 'title',
      flex: 2,
      minWidth: 200,
      sortable: true,
    },
    {
      headerName: 'Excerpt',
      field: 'excerpt',
      flex: 3,
      minWidth: 260,
      sortable: false,
      valueFormatter: (p) => (p.value ?? '').slice(0, 200),
      tooltipField: 'excerpt',
    },
    {
      headerName: 'Author',
      colId: 'author',
      field: 'author',
      flex: 1,
      minWidth: 140,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      filterParams: { filterOptions: ['contains'], maxNumConditions: 1 },
      valueGetter: (p) => p.data?.author?.name ?? '',
    },
    {
      headerName: 'Published',
      field: 'publishedAt',
      colId: 'publishedAt',
      flex: 1,
      minWidth: 130,
      sortable: true,
      sort: 'desc',
      valueFormatter: (p) =>
        p.value ? new Date(p.value).toLocaleDateString() : '',
    },
  ];

  /** Infinite row model datasource -> server-side pagination + sort + filter. */
  private readonly datasource: IDatasource = {
    getRows: (params: IGetRowsParams) => {
      const query = this.buildQuery(params);
      this.posts.list(query).subscribe({
        next: (res) => {
          this.totalCount = res.meta.total;
          params.successCallback(res.data, res.meta.total);
        },
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
  ) {
    this.search$.pipe(debounceTime(300)).subscribe(() => this.refresh());
  }

  onGridReady(event: GridReadyEvent<PostListItem>): void {
    this.gridApi = event.api;
    event.api.setGridOption('datasource', this.datasource);
  }

  onSearchChange(): void {
    this.search$.next();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.gridApi?.setFilterModel(null);
    this.gridApi?.applyColumnState({
      state: [{ colId: 'publishedAt', sort: 'desc' }],
      defaultState: { sort: null },
    });
    this.refresh();
  }

  onRowClicked(event: RowClickedEvent<PostListItem>): void {
    if (event.data) this.router.navigate(['/posts', event.data.id]);
  }

  private refresh(): void {
    this.gridApi?.paginationGoToFirstPage();
    this.gridApi?.purgeInfiniteCache();
  }

  private buildQuery(params: IGetRowsParams): PostListQuery {
    const page = Math.floor(params.startRow / PAGE_SIZE) + 1;
    const query: PostListQuery = { page, pageSize: PAGE_SIZE };

    const sort = params.sortModel?.[0];
    if (sort) {
      query.sort = sort.colId as PostSortField;
      query.order = sort.sort === 'asc' ? 'ASC' : 'DESC';
    }

    const authorFilter = params.filterModel?.['author']?.filter;
    if (authorFilter) query.author = authorFilter;

    if (this.searchTerm.trim()) query.search = this.searchTerm.trim();

    return query;
  }
}
