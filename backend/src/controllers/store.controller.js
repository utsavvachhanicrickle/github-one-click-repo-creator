import { z } from "zod";
import authValidations from "../validations/auth.validation.js";
import { User } from "../models/user.module.js";
import { Store } from "../models/store.module.js";
import { cloneRepoWithHistory } from "../services/githubRepo.service.js";

const createRepoSchema = z.object({
  repoName: z
    .string()
    .min(3, "Repo name must be at least 3 characters")
    .max(80, "Repo name is too long")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Repo name can only contain letters, numbers, dot, underscore, and dash",
    ),
});

export async function createStoreRepoController(req, res, next) {
  try {
    const { storeName } = req.body;
    const user = req.user;
    authValidations.userNotFound({ user });

    let adminId;
    if (user.role === "personal") {
      const adminRelations = await User.getAdminPersonalUserByPersonalId({
        personal_id: user.id,
      });
      authValidations.userNotFound({ user: adminRelations[0] });
      adminId = adminRelations[0].adminid;
    } else {
      adminId = user.id;
    }

    const repoName = `${storeName}_${user.name.replaceAll(" ", "")}`;
    const parsedResult = createRepoSchema.safeParse({ repoName });
    if (!parsedResult.success) {
      return res.status(400).json({
        success: false,
        message: parsedResult.error.errors[0].message,
      });
    }

    const description = `created this repository using github one-click repo creator by the help of ${user.unique_id}`;

    const result = await cloneRepoWithHistory({
      accessToken: req.session.githubAccessToken,
      repoName: repoName,
      description: description,
      isPrivate: true,
      sourceRepoUrl: "https://github.com/utsavvachhanicrickle/flutter_demo.git",
    });

    const dbResult = await Store.createStore({
      admin_id: adminId,
      creator_id: user.id,
      assigned_ids: [],
      store_name: storeName,
      repo_name: repoName,
      github_link: result.cloneUrl,
    });

    res.status(201).json({
      success: true,
      store: {
        dbResult,
      },
    });
  } catch (error) {
    // Handle Zod/AppError style errors
    if (error.statusCode && error.statusCode < 500) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    // GitHub duplicate repo
    if (error.status === 422) {
      return res.status(422).json({
        success: false,
        message:
          "GitHub could not create this repo. The name may already exist in your account.",
      });
    }
    next(error);
  }
}

export async function getStoreRepoController(req, res, next) {
  try {
    const user = req.user;
    authValidations.userNotFound({ user });

    let result = [];
    if (user.role === "personal") {
      result = await Store.getAllStoreByCreatorId({
        creator_id: user.id,
      });
    } else {
      result = await Store.getAllStoreByAdminId({
        admin_id: user.id,
      });
    }
    res.status(200).json({
      success: true,
      store: {
        result,
      },
    });
  } catch (error) {
    next(error);
  }
}
