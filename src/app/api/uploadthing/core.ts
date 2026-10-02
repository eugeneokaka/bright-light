import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { canManageProperties } from "@/lib/permissions";

const f = createUploadthing();

export const ourFileRouter = {
  propertyImage: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });

      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      if (!canManageProperties(session.user.role)) {
        throw new UploadThingError(
          "You do not have permission to upload property images",
        );
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
  imageUploader: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 8,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth.api.getSession({ headers: req.headers });

      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      if (!canManageProperties(session.user.role)) {
        throw new UploadThingError(
          "You do not have permission to upload images",
        );
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
