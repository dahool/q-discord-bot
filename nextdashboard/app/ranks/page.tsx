'use client'
import { useState } from 'react';
import { Datepicker, Table, Spinner, Button } from 'flowbite-react';
import { DateTime } from 'luxon';
import { useGetRanksQuery } from '@/lib/server/query'

export default function Page() {

  const maxDatePickerDate = DateTime.now();
  const [selectedDate, setSelectedDate] = useState<DateTime>(maxDatePickerDate);

  const { data: ranksData = [], isLoading, isError, isFetching } = useGetRanksQuery(selectedDate.toUTC().toISO()!);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const luxonDate = DateTime.fromJSDate(date);
      if (luxonDate.isValid) {
        // RTK Query will automatically refetch when param changes
        setSelectedDate(luxonDate);
      } else {
        console.error("Invalid date selected from datepicker.");
      }
    }
  };

  // Handler for downloading CSV
  const handleDownloadCsv = () => {
    if (!ranksData || ranksData?.length === 0) {
      console.log('No data to download.');
      return;
    }

    const headers = ["Name", "Score", "Tasks", "Position"];
    const csvRows = ranksData.map(rank => [
      `"${rank.name.replace(/"/g, '""')}"`, // Handle commas and quotes in name
      rank.score,
      `"${rank.tasks.replace(/"/g, '""')}"`,
      rank.position
    ].join(','));

    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    // Use Luxon for formatting the filename date
    link.setAttribute('download', `ranks_${(selectedDate || DateTime.now()).toISODate()}.csv`);
    document.body.appendChild(link); // Append to body is good practice for Firefox compatibility
    link.click(); // Programmatically click the link to trigger download
    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(url); // Free up memory
  };

  const displayLoading = isLoading || isFetching; // Use isFetching to show loading during refetches

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">IRON AT Leaderboard</h1>

        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="datepicker" className="text-gray-700 font-medium whitespace-nowrap">Select Date:</label>
            <Datepicker
              id="datepicker"
              onChange={handleDateChange}
              // Flowbite Datepicker expects a Date object for its value prop or a formatted string.
              // We pass a JS Date object from Luxon.
              value={selectedDate?.toJSDate()} // Or format date string: selectedDate?.toFormat('MM/dd/yyyy')
              maxDate={maxDatePickerDate.toJSDate()}
              showTodayButton={false} // Disable today button if maxDate is yesterday
              className="w-full sm:w-auto"
            />
          </div>
          <Button
            onClick={handleDownloadCsv}
            disabled={displayLoading || ranksData?.length === 0}
            className="w-full sm:w-auto px-6 py-2 rounded-lg"
          >
            Download
          </Button>
        </div>

        {displayLoading && (
          <div className="flex justify-center items-center h-48">
            <Spinner aria-label="Loading ranks" size="xl" />
            <span className="ml-2 text-lg text-gray-700">Loading ranks...</span>
          </div>
        )}

        {isError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">'An unknown error occurred.'</span>
          </div>
        )}

        {!displayLoading && ranksData && ranksData.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <Table className="min-w-full divide-y divide-gray-200" striped={true}>
              <Table.Head className="bg-gray-50">
                <Table.HeadCell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </Table.HeadCell>
                <Table.HeadCell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </Table.HeadCell>
                <Table.HeadCell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </Table.HeadCell>
                <Table.HeadCell className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="bg-white divide-y divide-gray-200">
                {ranksData.map((rank, index) => (
                  <Table.Row key={index} className="hover:bg-gray-50">
                    <Table.Cell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {rank.name}
                    </Table.Cell>
                    <Table.Cell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rank.score.toLocaleString()}
                    </Table.Cell>
                    <Table.Cell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rank.tasks}
                    </Table.Cell>
                    <Table.Cell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rank.position}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {!displayLoading && ranksData?.length === 0 && !isError && (
          <div className="text-center py-10 text-gray-600">
            No rank data available for the selected date.
          </div>
        )}
      </div>
    </div>
  );
};