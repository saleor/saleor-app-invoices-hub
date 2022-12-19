import { trpcClient } from "../../trpc/trpc-client";
import { LinearProgress, Paper, TextField, Typography } from "@material-ui/core";
import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  makeStyles,
  OffsettedList,
  OffsettedListBody,
  OffsettedListItem,
  OffsettedListItemCell,
} from "@saleor/macaw-ui";
import clsx from "clsx";

import { useForm } from "react-hook-form";
import { SellerShopConfig } from "../app-config";
import { AppConfigContainer } from "../app-config-container";
import { AddressForm } from "./address-form";

const useStyles = makeStyles((theme) => {
  return {
    header: { marginBottom: 20 },
    grid: { display: "grid", gridTemplateColumns: "1fr 2fr", alignItems: "start", gap: 40 },

    listItem: {
      cursor: "pointer",
      height: "auto !important",
    },
    listItemActive: {
      border: `2px solid ${theme.palette.primary.main}`,
    },

    formContainer: {
      top: 0,
      position: "sticky",
    },
  };
});

/**
 * todo
 * - add form (rhf?) -> dynamic, per channel
 * - save to metadata
 * - fetch initial state from metadata
 * - fallback to Shop
 */
export const ChannelsConfiguration = () => {
  const styles = useStyles();

  const { data: configurationData, refetch: refetchConfig } =
    trpcClient.appConfiguration.fetch.useQuery();
  const {
    data: channelsData,
    isLoading,
    isSuccess: isChannelsFetchSuccess,
  } = trpcClient.channels.fetch.useQuery();
  const [activeChannelSlug, setActiveChannelSlug] = useState<string | null>(null);
  const { mutate, error: saveError } = trpcClient.appConfiguration.setAndReplace.useMutation({
    onSuccess() {
      refetchConfig();
    },
  });

  useEffect(() => {
    if (isChannelsFetchSuccess) {
      setActiveChannelSlug(channelsData!.data!.channels![0].slug ?? null);
    }
  }, [isChannelsFetchSuccess, channelsData]);

  const activeChannel = useMemo(() => {
    try {
      return channelsData!.data!.channels!.find((c) => c.slug === activeChannelSlug)!;
    } catch (e) {
      return null;
    }
  }, [channelsData, activeChannelSlug]);

  if (isLoading || !channelsData?.data?.channels) {
    return <LinearProgress />;
  }

  return (
    <div>
      <Typography className={styles.header} variant="subtitle1">
        Configure seller details visible on the invoice
      </Typography>
      <div className={styles.grid}>
        <div>
          <OffsettedList gridTemplate={["1fr"]}></OffsettedList>
          <OffsettedListBody>
            {channelsData.data.channels.map((c) => {
              return (
                <OffsettedListItem
                  className={clsx(styles.listItem, {
                    [styles.listItemActive]: c.slug === activeChannelSlug,
                  })}
                  key={c.slug}
                  onClick={() => {
                    setActiveChannelSlug(c.slug);
                  }}
                >
                  <OffsettedListItemCell>{c.slug}</OffsettedListItemCell>
                </OffsettedListItem>
              );
            })}
          </OffsettedListBody>
        </div>

        {activeChannelSlug && (
          <Paper elevation={0} className={styles.formContainer}>
            <AddressForm
              key={activeChannelSlug}
              channelSlug={activeChannelSlug}
              onSubmit={async (data) => {
                const newConfig =
                  AppConfigContainer.setChannelAddress(configurationData)(activeChannelSlug)(data);

                mutate(newConfig);
              }}
              initialData={AppConfigContainer.getChannelAddress(configurationData)(
                activeChannelSlug
              )}
              channelName={activeChannel?.name ?? activeChannelSlug}
            />
            {saveError && <span>{saveError.message}</span>}
          </Paper>
        )}
      </div>
    </div>
  );
};