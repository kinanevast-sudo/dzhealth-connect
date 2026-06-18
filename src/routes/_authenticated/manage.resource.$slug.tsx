import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { getResource } from "@/lib/admin/resources";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/manage/resource/$slug")({
  component: ResourcePage,
});

function ResourcePage() {
  const { slug } = useParams({ from: "/_authenticated/manage/resource/$slug" });
  const { t } = useTranslation();
  const resource = getResource(slug);
  if (!resource) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">{t("manage.crud.notFound")}</p>
        <Link to="/manage" className="text-primary text-sm hover:underline">{t("manage.backHome")}</Link>
      </div>
    );
  }
  return <AdminDataTable resource={resource} />;
}
