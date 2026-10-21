import { useState } from "react";
import { Download } from "lucide-react";
import { adminApi, totalPages, type AdminSubscriber } from "../api";
import {
  AdminPage, Btn, ConfirmBtn, DataTable, ErrorBlock, Pager, SearchBox, Toolbar, type Column,
} from "../ui";
import { useAction, useDebounced, useQuery } from "../hooks";

const PAGE_SIZE = 50;

function RemoveButton({ sub, onRemoved }: { sub: AdminSubscriber; onRemoved: () => void }) {
  const { run, busy } = useAction();
  return (
    <ConfirmBtn size="sm" label="Remove" confirmLabel="Remove" loading={busy}
      onConfirm={async () => {
        const r = await run(() => adminApi.newsletter.remove(sub.emailId), {
          success: `${sub.userEmail} removed from the newsletter.`,
          errors: { 404: "That subscriber was already removed." },
          fallback: "Couldn't remove this subscriber.",
        });
        if (r.ok) onRemoved();
      }} />
  );
}

export default function NewsletterPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounced(search.trim());
  const [page, setPage] = useState(1);
  const exporter = useAction();

  const { data, loading, error, reload } = useQuery(
    () => adminApi.newsletter.list({ page, pageSize: PAGE_SIZE, search: debounced || undefined }),
    [page, debounced]
  );

  const exportCsv = () => exporter.run(() => adminApi.newsletter.exportCsv(), {
    fallback: "Couldn't export subscribers. Please try again.",
  });

  const columns: Column<AdminSubscriber>[] = [
    { key: "email", header: "Email", render: s => <span className="text-ink">{s.userEmail}</span> },
    { key: "actions", header: "", className: "text-right w-0 whitespace-nowrap", render: s => <RemoveButton sub={s} onRemoved={reload} /> },
  ];

  return (
    <AdminPage
      title="Newsletter"
      description="Newsletter subscribers. No signup date is stored, so the list is ordered by email."
      actions={
        <Btn variant="primary" onClick={exportCsv} loading={exporter.busy}>
          {!exporter.busy && <Download className="w-4 h-4" />} Export CSV
        </Btn>
      }
    >
      <Toolbar>
        <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search email" />
      </Toolbar>

      {error ? (
        <ErrorBlock message={error} onRetry={reload} />
      ) : (
        <>
          <DataTable columns={columns} rows={data?.items} rowKey={s => s.emailId} loading={loading}
            empty={debounced ? "No subscribers match that search." : "No subscribers yet."} />
          {data && <Pager page={page} totalPages={totalPages(data)} totalCount={data.totalCount} onChange={setPage} />}
        </>
      )}
    </AdminPage>
  );
}
